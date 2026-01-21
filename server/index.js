import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Database Configuration (Lazy Init) ---
let pool;
let dbInitialized = false;

const TECH_ERROR_MSG = "No momento estamos com problemas técnicos para armazenar feedback, desculpe.";

async function checkDbInit() {
  if (dbInitialized && pool) return;

  if (!process.env.DATABASE_URL) {
    console.error('CRITICAL: DATABASE_URL is missing in environment variables');
    throw new Error('DATABASE_URL não configurada no Vercel');
  }

  if (!pool) {
    console.log('Creating new connection pool...');
    const url = process.env.DATABASE_URL || '';
    const hasPort6543 = url.includes(':6543');
    const maskedUrl = url.replace(/:[^:@]+@/, ':****@');
    console.log(`Port 6543 (Pooler) detected: ${hasPort6543}`);
    console.log(`Connection string format: ${maskedUrl.substring(0, 30)}...`);

    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
  }

  try {
    console.log('Initializing database schema - Checking connection...');
    const testResult = await pool.query('SELECT 1');
    console.log('Connection test (SELECT 1) successful.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sentiment_feedbacks (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        ip TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS app_feedbacks (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        ip TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE sentiment_feedbacks ALTER COLUMN created_at TYPE TIMESTAMPTZ;
      ALTER TABLE app_feedbacks ALTER COLUMN created_at TYPE TIMESTAMPTZ;
    `);
    dbInitialized = true;
    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('DATABASE ERROR:', err.message);
    throw new Error(`Falha ao conectar no Supabase: ${err.message}`);
  }
}

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
};

// --- API Routes ---

app.get('/api/check-status', async (req, res) => {
  const ip = getClientIp(req);
  try {
    await checkDbInit();
    const appRes = await pool.query('SELECT id FROM app_feedbacks WHERE ip = $1', [ip]);
    const sentimentRes = await pool.query('SELECT EXTRACT(EPOCH FROM created_at) * 1000 as last_epoch FROM sentiment_feedbacks WHERE ip = $1 ORDER BY created_at DESC LIMIT 1', [ip]);

    const appRow = appRes.rows[0];
    const sentimentRow = sentimentRes.rows[0];

    const canSubmitApp = !appRow;
    let canSubmitSentiment = true;
    let nextAvailable = null;

    if (sentimentRow) {
      const lastTime = Number(sentimentRow.last_epoch);
      const now = Date.now();
      const waitTime = 2 * 60 * 60 * 1000;
      if (now - lastTime < waitTime) {
        canSubmitSentiment = false;
        nextAvailable = lastTime + waitTime;
      }
    }
    res.json({ canSubmitApp, canSubmitSentiment, nextAvailable });
  } catch (err) {
    console.error('Check Status Error:', err.message);
    res.status(503).json({ error: TECH_ERROR_MSG });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { content, type } = req.body;
  const ip = getClientIp(req);

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'O feedback não pode estar vazio.' });
  }

  try {
    await checkDbInit();
    if (type === 'sentiment') {
      const lastRes = await pool.query('SELECT EXTRACT(EPOCH FROM created_at) * 1000 as last_epoch FROM sentiment_feedbacks WHERE ip = $1 ORDER BY created_at DESC LIMIT 1', [ip]);
      const last = lastRes.rows[0];

      if (last) {
        const lastTime = Number(last.last_epoch);
        if (Date.now() - lastTime < 2 * 60 * 60 * 1000) {
          return res.status(403).json({ error: 'Por favor, aguarde 2 horas para enviar novamente.' });
        }
      }
      await pool.query('INSERT INTO sentiment_feedbacks (content, ip) VALUES ($1, $2)', [content, ip]);
    } else {
      await pool.query('INSERT INTO app_feedbacks (content, ip) VALUES ($1, $2)', [content, ip]);
    }
    res.json({ success: true });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(403).json({ error: 'Você já enviou uma sugestão para o app.' });
    }
    console.error('Submit Feedback Error:', error.message);
    res.status(503).json({ error: TECH_ERROR_MSG });
  }
});

app.get('/api/feedbacks/:type', async (req, res) => {
  const { type } = req.params;
  const password = req.headers['authorization'];

  console.log(`[Admin] Fetching feedbacks for: ${type}`);

  if (password !== process.env.FEEDBACK_PASSWORD) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const table = type === 'sentiment' ? 'sentiment_feedbacks' : 'app_feedbacks';
  try {
    await checkDbInit();
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(`[Admin] Fetch Feedbacks Error (${table}):`, err.message);
    res.status(503).json({ error: TECH_ERROR_MSG });
  }
});

app.get('/api/export/:type', async (req, res) => {
  const { type } = req.params;
  const password = req.query.pwd;

  console.log(`[Export] Request for: ${type}`);

  if (password !== process.env.FEEDBACK_PASSWORD) {
    console.warn('[Export] Unauthorized: Password mismatch');
    return res.status(401).send('Não autorizado.');
  }

  const table = type === 'sentiment' ? 'sentiment_feedbacks' : 'app_feedbacks';
  try {
    await checkDbInit();
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    const rows = result.rows;
    console.log(`[Export] Found ${rows.length} rows to export`);

    const headers = ['id', 'content', 'ip', 'created_at'];
    const csvRows = [headers.join(',')];
    for (const row of rows) {
      const values = headers.map(header => {
        const val = row[header];
        // Escapa aspas e trata quebras de linha para o CSV não quebrar
        const escaped = String(val || '').replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=feedbacks_${type}.csv`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('[Export] Database Error:', err.message);
    res.status(503).send(`Erro ao gerar CSV: ${err.message}`);
  }
});

// --- Serve Statics for Production ---
// On Vercel, we prefer to let Vercel handle statics via vercel.json rewrites
if (!process.env.VERCEL) {
  const distPath = join(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Não Encontrado' });
      res.sendFile(join(distPath, 'index.html'));
    });
  }
}

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;

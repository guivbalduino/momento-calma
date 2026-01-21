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

// --- Database Configuration (Exclusive Supabase/PostgreSQL) ---
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TECH_ERROR_MSG = "No momento estamos com problemas técnicos para armazenar feedback, desculpe.";

// Attempt to check connection and init schema
try {
  if (process.env.DATABASE_URL) {
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
      -- Forçar alteração de coluna caso a base já exista sem fuso horário
      ALTER TABLE sentiment_feedbacks ALTER COLUMN created_at TYPE TIMESTAMPTZ;
      ALTER TABLE app_feedbacks ALTER COLUMN created_at TYPE TIMESTAMPTZ;
    `);
    console.log('PostgreSQL (Supabase) connected and initialized.');
  } else {
    console.error('CRITICAL: DATABASE_URL is missing in .env');
  }
} catch (err) {
  console.error('Database Init Error:', err.message);
}

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
};

// --- API Routes ---

app.get('/api/check-status', async (req, res) => {
  const ip = getClientIp(req);
  try {
    const appRes = await pool.query('SELECT id FROM app_feedbacks WHERE ip = $1', [ip]);
    // Extraímos o EPOCH para evitar confusão de fuso horário no Driver JS
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
  if (password !== process.env.FEEDBACK_PASSWORD) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const table = type === 'sentiment' ? 'sentiment_feedbacks' : 'app_feedbacks';
  try {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch Feedbacks Error:', err.message);
    res.status(503).json({ error: TECH_ERROR_MSG });
  }
});

app.get('/api/export/:type', async (req, res) => {
  const { type } = req.params;
  const password = req.query.pwd;
  if (password !== process.env.FEEDBACK_PASSWORD) {
    return res.status(401).send('Não autorizado.');
  }

  const table = type === 'sentiment' ? 'sentiment_feedbacks' : 'app_feedbacks';
  try {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    const rows = result.rows;

    const headers = ['id', 'content', 'ip', 'created_at'];
    const csvRows = [headers.join(',')];
    for (const row of rows) {
      const values = headers.map(header => {
        const val = row[header];
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=feedbacks_${type}.csv`);
    res.status(200).send(csvRows.join('\n'));
  } catch (err) {
    console.error('Export Error:', err.message);
    res.status(503).send(TECH_ERROR_MSG);
  }
});

// --- Serve Statics for Production ---
const distPath = join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Não Encontrado' });
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;

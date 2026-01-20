-- Tabela para feedbacks de sentimento (End of exercise)
CREATE TABLE IF NOT EXISTS sentiment_feedbacks (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    ip TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para sugestões do app (Floating button)
CREATE TABLE IF NOT EXISTS app_feedbacks (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    ip TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Postgres 16 + pgvector (VPS). Espelho do SQLite local em kb/data/kb.sqlite.
-- Embeddings entram depois; o scrape dos concorrentes NUNCA é público.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS kb_documents (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('ces', 'sechat', 'midia')),
  source_url TEXT NOT NULL,
  slug TEXT,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  author TEXT,
  lang TEXT,
  published_at DATE,
  content_chars INTEGER,
  truncated BOOLEAN DEFAULT FALSE,
  checksum TEXT NOT NULL,
  type_source TEXT,
  category_source TEXT,
  pillar TEXT,
  type_guess TEXT,
  kind TEXT CHECK (kind IN ('evergreen', 'historical', 'skip')),
  cluster_id TEXT,
  entities_json JSONB DEFAULT '[]'::jsonb,
  impact_score REAL DEFAULT 0,
  skip_reason TEXT,
  ingested_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kb_clusters (
  id TEXT PRIMARY KEY,
  pillar TEXT,
  kind TEXT,
  label TEXT,
  keyword TEXT,
  slug TEXT,
  doc_count INTEGER DEFAULT 0,
  latest_at DATE,
  impact_score REAL DEFAULT 0,
  tsc_role TEXT CHECK (tsc_role IN ('hub', 'node', 'skip', 'candidate', 'midia')),
  guide_doc_id TEXT
);

CREATE TABLE IF NOT EXISTS kb_serp (
  query TEXT NOT NULL,
  position INTEGER NOT NULL,
  url TEXT,
  title TEXT,
  domain TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (query, position)
);

CREATE INDEX IF NOT EXISTS kb_documents_cluster ON kb_documents (cluster_id);
CREATE INDEX IF NOT EXISTS kb_documents_kind ON kb_documents (kind);
CREATE INDEX IF NOT EXISTS kb_clusters_role ON kb_clusters (tsc_role);

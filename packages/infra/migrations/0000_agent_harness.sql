CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY NOT NULL,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  answer TEXT,
  steps INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  finished_at INTEGER
);

CREATE TABLE agent_events (
  run_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  tag TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  PRIMARY KEY (run_id, sequence),
  FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
);

CREATE INDEX agent_events_observed_at_idx
  ON agent_events (observed_at);

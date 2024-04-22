DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS refactorings;

CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  projectRunId TEXT,
  user TEXT,
  repo TEXT,
  appRoot TEXT,
  status TEXT,
  completed BOOLEAN
);

CREATE TABLE refactorings (
  id INTEGER PRIMARY KEY,
  projectRunId TEXT,
  path TEXT,
  originalFile TEXT,
  newFile TEXT
);

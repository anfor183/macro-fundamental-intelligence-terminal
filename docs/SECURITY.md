# Security & Risk Controls

## 1. Credential Security
- **Zero Hardcoded Secrets**: All API keys, database URLs, and configuration parameters are loaded strictly from environment variables or encrypted secrets via `pydantic-settings`.
- **Git Ignore**: `.env` and SQLite database binaries (`*.db`) are excluded from version control.

## 2. Input Sanitization & Ingestion Security
- Ingested HTML descriptions are stripped of all script and markup tags using regex sanitization before storage.
- All database queries are fully parameterized via SQLAlchemy 2.0 ORM expressions, preventing SQL injection vulnerabilities.

## 3. Network & Rate Limiting
- External HTTP requests enforce strict timeouts (8-10 seconds) and run through circuit breakers.
- Reverse proxy configurations in Docker isolate database and internal services from public ingress.

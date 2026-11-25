# AI Workspace: backend (NestJS)

The API for the AI-Powered Collaborative Workspace POC. See the [root README](../README.md) for the full picture,
the quick start and the known limits. This file covers the backend only.

## What is in here

- REST API under `/api` (auth, users, projects, tasks, documents, AI generation)
- Socket.IO gateway for real-time task events
- PostgreSQL through Prisma 7 (`@prisma/adapter-pg`), with the `pgvector` extension for embeddings
- Gemini calls for task generation and for embeddings
- A read-only MCP endpoint for Claude Code

## Setup

```bash
pnpm install               # also runs `prisma generate`
cp .env.example .env       # fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
pnpm db:migrate            # needs pgvector installed on the database server
pnpm db:seed               # optional demo data
pnpm start:dev             # http://localhost:3000/api
```

PostgreSQL needs the pgvector package (Ubuntu: `sudo apt install postgresql-16-pgvector`). The first document
migration runs `CREATE EXTENSION IF NOT EXISTS vector;`.

## Environment variables

| Variable | Meaning | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL URL | required |
| `PORT` | API port | `3000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3001` |
| `JWT_SECRET` | Token signing secret | required |
| `GEMINI_API_KEY` | Gemini key (AI answers 503 without it) | none |
| `GEMINI_MODEL` | Generation model | `gemini-3.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | Embedding model | `gemini-embedding-001` |
| `DOCUMENTS_DIR` | Folder for uploaded files | `storage/documents` |
| `MAX_UPLOAD_MB` | Max size per file | `10` |
| `RAG_TOP_K` | Chunks sent to the AI | `6` |
| `RAG_MIN_SCORE` | Minimum similarity to count as evidence | `0.5` |

## Scripts

| Command | Does |
|---|---|
| `pnpm start:dev` | Run with auto-reload |
| `pnpm build`, `pnpm start:prod` | Build, then run `dist/main` |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm lint` | oxlint with type-aware rules |
| `pnpm format` | Prettier |
| `pnpm db:migrate` | `prisma migrate dev` with a timestamped name |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:seed` | Demo project and tasks |

## How the app starts (`src/main.ts`)

1. Prefers IPv4 for network calls (some networks cannot reach IPv6 and Gemini calls would time out).
2. Creates the Nest app from `AppModule`, and sets the global prefix `api`.
3. Enables cookie parsing and CORS for `FRONTEND_URL` (with credentials, so the login cookie works).
4. Uses the custom Socket.IO adapter so WebSockets share the same CORS and cookie handling.
5. Adds a global `ValidationPipe` (`whitelist` drops unknown fields, `transform` builds DTO objects).

## Modules (`src/module`)

| Module | Job |
|---|---|
| `auth` | Register, login, logout, `me`. The JWT lives in an HTTP-only cookie named `token` (valid 7 days). `JwtAuthGuard` protects routes. |
| `user` | `GET /users` for the assignee dropdown. |
| `project` | Create, list and read projects. `findOne` throws 404 for unknown ids. |
| `task` | Tasks per project, status changes, and `TaskGateway` (Socket.IO). |
| `document` | Upload, text reading, chunking, embeddings and vector search (below). |
| `ai` | The generate-task endpoint, the prompt, and the checking of Gemini's answer (below). |
| `mcp` | MCP server with the read-only tools `ping`, `list_projects`, `list_tasks`. |

### `document` module

| File | Job |
|---|---|
| `document.controller.ts` | Routes under `/projects/:projectId/documents`, upload limits (10 files, `MAX_UPLOAD_MB` each). |
| `document.service.ts` | Validates and saves uploads, tracks status, runs `process()` in the background, resets interrupted documents on startup. |
| `document-files.ts` | Accepts only PDF and DOCX: extension, MIME type and first bytes must all match. |
| `document-storage.ts` | Saves, reads and deletes files in one private folder, and refuses paths that leave it. |
| `document-text.ts` | `readPdf` (one text per page), `readDocx` (one text per heading), `splitIntoChunks` (2000 characters, 200 overlap, never mixes two pages or sections). |
| `embedding.service.ts` | Text to 768 numbers with Gemini. Batches of 30, paced to 90 requests per minute, waits as long as Google asks on 429, retries on 503. |
| `knowledge.service.ts` | `saveChunks` (embed, then store text and vector in one transaction) and `search` (embed the question, find the closest chunks with pgvector, drop weak matches). |

The search query is scoped by project in SQL: the chunk and its document must both belong to the project, and the
document must be `PROCESSED`. Vectors are written and read with raw SQL because Prisma cannot write the `vector` column.

### `ai` module

| File | Job |
|---|---|
| `ai.controller.ts` | `POST /ai/generate-task`. |
| `ai.service.ts` | The steps: check the key, load the project and recent task titles, search documents, build the prompt, call Gemini, check the answer. |
| `ai.prompt.ts` | The system instruction, the JSON schema Gemini must follow, and `buildPrompt` (document chunks go in tagged boxes with short ids `c1`, `c2`, ...). |
| `ai.result.ts` | Parses and validates the answer, verifies that cited chunk ids are real, and computes `contextStatus`. |
| `ai.dto.ts` | Validation rules for the request and for what Gemini returns (lengths, allowed values, list sizes). |
| `gemini.client.ts`, `gemini.module.ts` | One shared Gemini client (30 second timeout), or `null` when no key is set. |

Google errors are mapped to simple HTTP errors: 429 rate limit, 503 busy, 401/403 not configured, 404 model not
found, anything else 502.

## Database (`prisma/schema`)

| File | Contents |
|---|---|
| `user.prisma`, `project.prisma`, `task.prisma` | Users, projects and tasks. Tasks are indexed by `projectId` and `assigneeId`. |
| `document.prisma` | `ProjectDocument` (file details, status, content hash, unique per project) and `DocumentChunk` (text, page, section, `vector(768)` embedding). |
| `enum.prisma` | `TaskStatus` (TODO, IN_PROGRESS, COMPLETED, BLOCKED) and `Priority` (LOW, MEDIUM, HIGH, CRITICAL). |

Deleting a project or document deletes its chunks. There is no vector index yet, so search scans the project's chunks.

## MCP endpoint

`POST /api/mcp` is stateless: each request builds a fresh server, so nothing is remembered between requests. It has
no login and only accepts localhost hosts, so it is for local development.

```bash
claude mcp add --scope user --transport http ai-workspace http://localhost:3000/api/mcp
```

Tools are registered in `src/module/mcp/mcp.service.ts` and reuse `ProjectService` and `TaskService`, so the data and
rules are the same as the website's.

## Tests

`pnpm test` runs the unit tests in `*.spec.ts` next to the code: auth, projects, documents (validation, chunking,
processing), embeddings (pacing and rate limits, using a fake clock), knowledge search (project scoping, top-K, score
threshold) and AI generation (answer checking, source verification, error mapping). Gemini and the database are faked,
so these tests do not call any real service. The `test:e2e` script exists, but there are no e2e specs yet.

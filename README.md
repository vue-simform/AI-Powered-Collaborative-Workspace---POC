# AI-Powered Collaborative Workspace (POC)

A proof of concept for a project-management workspace with a Kanban board, real-time updates and an AI assistant.
A manager types a short task title, and the AI drafts a full task. The draft is checked against the requirement
documents (PDF or DOCX) that were uploaded to that project, and every claim is marked as documented or not.

Nothing the AI suggests is saved until a person reviews it and presses **Create task**.

## What it does

| Area | What you can do |
|---|---|
| Authentication | Register, log in and log out. The login is a JWT stored in an HTTP-only cookie. |
| Projects | Create projects and open a project to see its board. |
| Kanban board | Four columns (To do, In progress, Completed, Blocked). Move tasks between columns and assign them to a user. |
| Real-time updates | When a task is created or changes status, assigned users see it live (Socket.IO). |
| Project documents | Upload PDF or DOCX files per project. They are read, split into chunks, embedded and stored. |
| AI task generation | Type a title. The AI returns a task with acceptance criteria, subtasks and technical considerations. |
| Requirement check (RAG) | The AI sees only matching excerpts from this project's documents. Each requirement is marked documented, partially documented or not documented, with the page or section it came from. |
| MCP server | Claude Code can read your projects and tasks through a small read-only MCP endpoint (local use only). |

## How the AI and document search works

```
UPLOAD   PDF/DOCX -> read text (per page / heading) -> cut into chunks -> embed (768 numbers each)
                                                                      -> store text + numbers in PostgreSQL (pgvector)

GENERATE title -> embed the title -> find the closest chunks of THIS project (cosine distance)
               -> send the title + those chunk texts to Gemini -> Gemini answers in a fixed JSON shape
               -> the server checks the answer and the cited sources -> the manager reviews -> Create task
```

Key ideas:

- **The numbers only find the text.** Gemini never sees the numbers. It receives the real text of the matching chunks.
- **Project isolation.** The search SQL requires both the chunk and its document to belong to the current project, so one project can never read another project's documents.
- **The server does not trust the AI.** A requirement counts as documented only if it cites a chunk that the server really sent. Otherwise it is downgraded to "not documented". The server checks that the cited chunk exists. It does not re-read the PDF to confirm the claim is true.
- **Documents are untrusted data.** Chunk text is wrapped in tagged boxes and any fake delimiter inside a document is neutralised, so a document cannot give instructions to the model.
- **Nothing is saved by the AI.** The AI has no tools and no database access. Only the final Create task button saves a task.

## Tech stack

| Part | Technology |
|---|---|
| Backend | NestJS 12 (ESM, TypeScript), Prisma 7 with the `pg` adapter, Socket.IO, class-validator |
| Database | PostgreSQL 16 with the `pgvector` extension |
| AI | Google Gemini through `@google/genai` (text generation and `gemini-embedding-001` embeddings, 768 numbers per text) |
| File reading | `unpdf` (PDF, per page) and `mammoth` (DOCX, per heading) |
| MCP | `@modelcontextprotocol/server` and `@modelcontextprotocol/node` (stateless Streamable HTTP), Zod for tool inputs |
| Frontend | Next.js 16, React 19, TanStack Query, axios, Tailwind CSS 4, shadcn/ui and Base UI, socket.io-client |
| Tests and tooling | Vitest, oxlint, Prettier (backend), ESLint (frontend), pnpm |

## Repository layout

```
.
├── AI-backend-nestjs/        NestJS API (port 3000)
│   ├── prisma/               schema files, migrations, seed
│   └── src/
│       ├── main.ts           app start: /api prefix, cookies, CORS, validation, Socket.IO
│       └── module/
│           ├── auth/         register, login, logout, me, JWT guard
│           ├── user/         list users (for the assignee dropdown)
│           ├── project/      projects
│           ├── task/         tasks, status changes, Socket.IO gateway
│           ├── document/     upload, text reading, chunking, embeddings, vector search
│           ├── ai/           Gemini client, prompt, answer checking, generate-task endpoint
│           └── mcp/          MCP server (read-only tools)
└── AI-frontend-nextjs/       Next.js app (port 3001)
    └── src/
        ├── app/              pages: login, register, dashboard, project
        ├── modules/          auth, dashboard, project, task, document, user (components, hooks, services, types)
        ├── components/ui/    shared UI building blocks
        └── lib/              axios instance, socket client, helpers
```

## Prerequisites

- Node.js 24 (the version used while building this POC) and pnpm
- PostgreSQL 16 with the **pgvector** extension installed on the database server
  - Ubuntu: `sudo apt install postgresql-16-pgvector`
  - If your database user cannot create extensions, run `CREATE EXTENSION vector;` once as a superuser. The first migration runs `CREATE EXTENSION IF NOT EXISTS vector;`.
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/). The free tier is enough, but it has limits (see below).

## Quick start

### 1. Create the database

Create an empty PostgreSQL database (for example `ai_workspace`) and note its connection URL.

### 2. Backend

```bash
cd AI-backend-nestjs
pnpm install                 # also runs `prisma generate`
cp .env.example .env         # then edit .env (see "Environment variables")
pnpm db:migrate              # creates the tables and the vector column
pnpm db:seed                 # optional: a demo project with sample tasks
pnpm start:dev               # http://localhost:3000/api
```

### 3. Frontend

```bash
cd AI-frontend-nextjs
pnpm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3000
pnpm dev                     # http://localhost:3001
```

### 4. Try it

1. Open <http://localhost:3001> and register an account.
2. Create a project (or open the demo project).
3. Open the **Documents** tab and upload a PDF or DOCX that contains requirements. Wait until its badge says **Processed**.
4. Go back to the board, add a task, type a title such as "Implement user registration" and press **Generate with AI**.
5. Review the suggestion. The "Technical considerations" list shows where each requirement came from and what is not documented. Edit anything, then press **Create task**.

## Environment variables (backend `.env`)

| Variable | Meaning | Default if unset |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URL | none (required) |
| `PORT` | API port | `3000` |
| `FRONTEND_URL` | Allowed browser origin (CORS) | `http://localhost:3001` |
| `JWT_SECRET` | Secret used to sign login tokens. Use a long random string. | none (required) |
| `GEMINI_API_KEY` | Gemini key. Without it the app still starts, but AI features answer 503. | none |
| `GEMINI_MODEL` | Model used to generate tasks | `gemini-3.5-flash` in code (`.env.example` sets `gemini-3.5-flash-lite`) |
| `GEMINI_EMBEDDING_MODEL` | Model used for embeddings | `gemini-embedding-001` |
| `DOCUMENTS_DIR` | Where uploaded files are saved on disk | `storage/documents` |
| `MAX_UPLOAD_MB` | Largest allowed file size | `10` |
| `RAG_TOP_K` | How many chunks are sent to the AI | `6` |
| `RAG_MIN_SCORE` | Minimum similarity (0 to 1) for a chunk to count as evidence | `0.5` |

Frontend `.env.local`: `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`).

Never commit `.env`. It is already in `.gitignore`, as is the `storage/` folder with uploaded documents.

## API overview

All routes start with `/api`. Except register and login, every route needs the login cookie.

| Method and path | Purpose |
|---|---|
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Authentication |
| `GET /users` | List users |
| `GET /projects`, `POST /projects`, `GET /projects/:projectId` | Projects |
| `GET /projects/:projectId/tasks`, `POST /projects/:projectId/tasks` | Tasks of a project |
| `PATCH /tasks/:taskId/status` | Change a task's status |
| `GET /projects/:projectId/documents` | List a project's documents |
| `POST /projects/:projectId/documents` | Upload up to 10 files (form field `files`) |
| `DELETE /projects/:projectId/documents/:documentId` | Delete a document and its chunks |
| `POST /projects/:projectId/documents/:documentId/retry` | Process a failed document again |
| `POST /ai/generate-task` | Body: `projectId`, `title`, optional `description` and `additionalInstructions`. Returns a task and its requirement analysis. Nothing is saved. |
| `POST /mcp` | MCP endpoint (localhost only, no login) |

### Document status

`UPLOADED` then `PROCESSING` then `PROCESSED`, or `FAILED` (with a readable message and a Retry button).
Only `PROCESSED` documents are searched. Processing runs inside the API process, so a restart marks unfinished
documents as `FAILED` and they can be retried.

### Result of generate-task

`status` is `ok` (a task plus analysis) or `needs_clarification` (the title is too vague, and a question is returned).
For `ok`, `contextStatus` is one of:

| Value | Meaning |
|---|---|
| `NO_CONTEXT` | Nothing relevant was found in the project's documents (this includes a project with no documents) |
| `NOT_SUPPORTED` | Relevant text was found, but no requirement is backed by it |
| `PARTIALLY_SUPPORTED` | Some requirements are documented, some are not |
| `SUPPORTED` | All requirements are documented |

Each requirement is `DOCUMENTED`, `PARTIALLY_DOCUMENTED` or `NOT_DOCUMENTED`, with its verified sources (document, page or section).

## Real-time events (Socket.IO)

The server puts each connected user in a room for every project where they have an assigned task, and emits:

| Event | When |
|---|---|
| `task:created` | A task is created. A newly assigned user joins the project room first, so they receive it too. |
| `task:status-updated` | A task's status changes. |

## MCP server (Claude Code, local only)

A read-only MCP endpoint lets Claude Code ask about your workspace.

| Tool | Does |
|---|---|
| `ping` | Test tool, returns "pong" |
| `list_projects` | Lists all projects (id, name, description) |
| `list_tasks` | Lists a project's tasks, with an optional status filter |

Register it once for all folders on your computer, with the backend running:

```bash
claude mcp add --scope user --transport http ai-workspace http://localhost:3000/api/mcp
```

Important limits: the endpoint has **no login** and only accepts requests whose host is `localhost`, so it is for local development only. It is not ready to be exposed to the internet. Claude may not call these tools unless
your question clearly concerns the AI Workspace app.

## Free-tier limits for Gemini

These matter when uploading documents, because every chunk is one embedding request.

- The embedding model allows about 100 requests per minute and 1,000 per day on the free tier. The app sends at most 90 per minute, in batches of 30.
- When Google answers 429 ("too many requests"), the app waits as long as Google asks (up to 2 minutes) and retries. A longer wait is treated as the daily limit, and the document is marked `FAILED` with a clear message.
- Embedding progress is written to the backend terminal, for example `Embedded 60/100 chunks`.
- A very large document can use up the daily quota and fail partway. Smaller documents are fine.

## Scripts

Backend (`AI-backend-nestjs`):

| Command | Does |
|---|---|
| `pnpm start:dev` | Run with auto-reload |
| `pnpm build` and `pnpm start:prod` | Build and run the compiled app |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm lint` | Type-aware lint (oxlint) |
| `pnpm db:migrate` | Create and apply a migration |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:seed` | Add the demo project and tasks |

Frontend (`AI-frontend-nextjs`): `pnpm dev` (port 3001), `pnpm build`, `pnpm start`, `pnpm lint`.

## Known limits of this POC

- **No OCR.** A scanned PDF has no text and is marked `FAILED`.
- **DOCX has sections, not pages.** Sources for DOCX files show the heading instead of a page number.
- **Processing runs inside the API process.** There is no job queue, so a restart interrupts running documents (they can be retried).
- **Files are stored on the local disk** (`storage/documents`), not in object storage.
- **No vector index.** Search compares the question against every chunk of the project. This is fine for a POC and will slow down with very large data.
- **Anyone logged in who can open a project can use its documents.** There are no project roles or membership rules yet.
- **The MCP endpoint is unauthenticated** and local only.
- **The task form sends only the title.** The API also accepts a description and extra instructions, but the form does not have fields for them yet.
- **The embedding size is fixed at 768.** Changing the embedding model means re-embedding every document.
- **There are no end-to-end tests yet.** The `test:e2e` script exists, but the `test/` folder is empty.

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `extension "vector" is not available` during migration | pgvector is not installed on the database server. Install it (see Prerequisites) and run the migration again. |
| AI endpoints answer 503 "AI is not configured" | `GEMINI_API_KEY` is missing in the backend `.env`. |
| 404 "AI model was not found" | `GEMINI_MODEL` names a model that does not exist for your key. Check the name. |
| 429 "AI rate limit reached" | Free-tier request limit. Wait a minute, or until the daily reset. |
| 504 or "AI service is unavailable" | Google timed out. Try again. |
| A document stays `FAILED` | Read the message under it. Scanned PDFs, corrupted files and quota limits are the usual reasons. Press Retry. |
| Browser shows "Cannot reach the server" | The backend is not running, or `NEXT_PUBLIC_API_URL` / `FRONTEND_URL` do not match the real addresses and ports. |
| Network calls to Gemini time out on IPv6 networks | The backend already prefers IPv4 in `main.ts`. |
| `/mcp` in Claude Code does not show `ai-workspace` | Register it with `--scope user` (see MCP section) so it works from any folder, and make sure the backend is running. |

## Documentation inside the code

Every backend and frontend source file (except the generated `components/ui` files and the tests) has short, plain-language comments that explain what each function does.

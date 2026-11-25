# AI Workspace: frontend (Next.js)

The web app for the AI-Powered Collaborative Workspace POC. See the [root README](../README.md) for the full picture,
the quick start and the known limits. This file covers the frontend only.

> This project uses Next.js 16 and React 19, which differ from older versions. See `AGENTS.md` before changing
> framework-level code.

## Setup

```bash
pnpm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:3000
pnpm dev                       # http://localhost:3001
```

The backend must be running (default `http://localhost:3000`). Its `FRONTEND_URL` must match this app's address, or
the browser will block the requests (CORS).

| Command | Does |
|---|---|
| `pnpm dev` | Dev server on port 3001 |
| `pnpm build`, `pnpm start` | Production build and server |
| `pnpm lint` | ESLint |

## Pages (`src/app`)

| Route | Purpose |
|---|---|
| `/` | Redirects to `/dashboard` when logged in, otherwise to `/login` |
| `/login`, `/register` | Authentication |
| `/dashboard` | Project list and overview (after the session check) |
| `/projects/[projectId]` | A project: Board, Team activity and Documents tabs |

## Structure (`src/modules`)

Each feature folder has the same layout: `components`, `hooks`, `services`, `types` (and `utils` or `constants`
where needed).

| Module | Contents |
|---|---|
| `auth` | Login and register forms, session hook |
| `dashboard` | Dashboard view |
| `project` | Project view with tabs, create-project sheet (with the document picker) |
| `task` | Kanban board, task cards and details, stats, socket provider, and the create-task flow |
| `document` | Document picker (drag and drop), list with status badges, hooks that poll while processing |
| `user` | Users hook for the assignee dropdown |

Shared code: `src/lib/api.ts` (axios instance with the cookie, and `errorMessage`), `src/lib/socket.ts`
(Socket.IO client), `src/components/ui` (generated UI components).

## How data moves

- **Server data** is loaded and cached with TanStack Query. Writes are mutations that refetch the affected list.
- **Auth** is the HTTP-only cookie set by the backend. The axios instance uses `withCredentials`, so every request
  carries it. The app never reads the token itself.
- **Real time:** a Socket.IO connection (socket provider) updates the board when `task:created` and
  `task:status-updated` arrive.

## Document upload (`modules/document`)

1. `document-picker.tsx` takes dropped or chosen files. `checkFiles` rejects wrong types, empty files, files over 10 MB,
   repeats and more than 10 files. The server checks everything again.
2. `useUploadDocuments` sends the files as multipart form data (field name `files`) to
   `POST /projects/:projectId/documents`, then refetches the list.
3. `useDocuments` polls every 2 seconds while any document is `UPLOADED` or `PROCESSING`, so the status badge
   changes to `PROCESSED` or `FAILED` by itself. A failed document can be retried or replaced.

## Generating a task with AI (`modules/task`)

`create-task-flow.tsx` has two steps in one sheet:

1. **Title.** The manager types a title and presses Generate with AI. The action calls
   `POST /ai/generate-task` with `projectId` and `title`. If the title is too vague, the AI's question is shown. The
   form currently has no fields for a description or extra instructions, although the API accepts them.
2. **Review.** The suggested task is shown in an editable form. `applyDocumentContext` (in `task.utils.ts`) adds the
   document findings to the "Technical considerations" list: a warning when the documents do not support the task, the
   sources used (for example `Requirements.pdf p.4`), requirements that are partly or not documented, and AI
   suggestions. Nothing is saved until the manager presses **Create task**. The new card then appears on the board at
   once (optimistic update) and is replaced by the saved task when the server answers.

## Not covered

There are no frontend tests. Browser behaviour such as drag and drop, polling and the review step was not covered by
automated tests.

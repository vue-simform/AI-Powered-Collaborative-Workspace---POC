// Names of the real-time (Socket.IO) events the server sends. The frontend listens for these exact strings.
export const TASK_EVENTS = {
  created: 'task:created',
  statusUpdated: 'task:status-updated',
} as const;

// One room per project: the people who have a task assigned in it. Only the server decides who is in it.
export const projectRoom = (projectId: string) => `project:${projectId}`;

// One room per user (server-side only), used to add a user's open tabs to a project room.
export const userRoom = (userId: string) => `user:${userId}`;

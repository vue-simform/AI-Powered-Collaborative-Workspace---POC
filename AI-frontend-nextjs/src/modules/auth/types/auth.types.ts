// The logged-in user.
export type User = { id: string; name: string; email: string };

// Fields sent when logging in.
export type LoginInput = { email: string; password: string };

// Fields sent when registering.
export type RegisterInput = { name: string; email: string; password: string };

"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import { useMe } from "@/modules/auth/hooks/auth.hooks";
import { taskKeys } from "@/modules/task/hooks/task.hooks";
import { TASK_EVENTS } from "@/modules/task/types/task.socket";
import type { Task } from "@/modules/task/types/task.types";
import { addTask, replaceTask } from "@/modules/task/utils/task-cache";

// Keeps the TanStack Query task cache in sync with changes made by other users.
// Connects only while signed in. The server decides which projects' events this user receives; REST stays the source of truth.
// Renders nothing; it only listens for live task events (Socket.IO) and updates the TanStack Query cache.
export function SocketProvider() {
  const queryClient = useQueryClient();
  const { data: user } = useMe();
  // Only open the socket when logged in.
  const signedIn = !!user;

  // useEffect runs after render: connect and add listeners here, and clean them up in the returned function.
  useEffect(() => {
    if (!signedIn) return;

    // Someone created a task: setQueryData writes straight into the cache, so the board updates with no refetch.
    const onCreated = (task: Task) =>
      queryClient.setQueryData<Task[]>(taskKeys.byProject(task.projectId), (old) => addTask(old, task));
    // Someone changed a status: replace that task in the cached list.
    const onStatusUpdated = (task: Task) =>
      queryClient.setQueryData<Task[]>(taskKeys.byProject(task.projectId), (old) => replaceTask(old, task));

    // Events are not replayed after an outage, so refetch over REST when the socket comes back.
    // Tracks if this is the first connection. On a reconnect we may have missed events, so we refetch everything.
    let connectedBefore = false;
    const onConnect = () => {
      if (connectedBefore) void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      connectedBefore = true;
    };

    // Register listeners. The cleanup below removes them so they are not added twice.
    socket.on(TASK_EVENTS.created, onCreated);
    socket.on(TASK_EVENTS.statusUpdated, onStatusUpdated);
    socket.on("connect", onConnect);
    socket.connect();

    // Cleanup: runs on logout or unmount. Remove listeners and close the connection.
    return () => {
      socket.off(TASK_EVENTS.created, onCreated);
      socket.off(TASK_EVENTS.statusUpdated, onStatusUpdated);
      socket.off("connect", onConnect);
      socket.disconnect();
    };
  }, [signedIn, queryClient]);

  return null;
}

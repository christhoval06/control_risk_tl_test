import { useEffect, useRef } from 'react';
import { apiBaseUrl } from '@configs/api';
import type { TaskItem, TaskStatus } from '@features/tasks/types';

interface StatusEvent {
  id: string;
  status: TaskStatus;
}

export function useTaskStatusStream(token: string, onStatusChange: (event: StatusEvent) => void) {
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!token || typeof EventSource === 'undefined') return;

    const stream = new EventSource(`${apiBaseUrl}/tasks/stream?access_token=${encodeURIComponent(token)}`);
    stream.addEventListener('task-status-updated', (event) => {
      try {
        onStatusChangeRef.current(JSON.parse((event as MessageEvent).data) as StatusEvent);
      } catch {
        // Ignore malformed stream events and keep the connection alive.
      }
    });

    return () => stream.close();
  }, [token]);
}

export function applyStatusEvent(tasks: TaskItem[], event: StatusEvent) {
  return tasks.map((task) => (task.id === event.id ? { ...task, status: event.status } : task));
}

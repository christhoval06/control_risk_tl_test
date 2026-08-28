import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiBaseUrl } from '@configs/api';
import { useTaskStatusStream } from './useTaskStatusStream';

class EventSourceStub {
  static instances: EventSourceStub[] = [];

  close = vi.fn();
  listeners = new Map<string, (event: MessageEvent) => void>();

  constructor(public readonly url: string) {
    EventSourceStub.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener) {
    this.listeners.set(type, listener as (event: MessageEvent) => void);
  }

  emit(type: string, data: unknown) {
    this.listeners.get(type)?.({ data: JSON.stringify(data) } as MessageEvent);
  }
}

describe('useTaskStatusStream', () => {
  beforeEach(() => {
    EventSourceStub.instances = [];
    vi.stubGlobal('EventSource', EventSourceStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps one stream open across handler rerenders and dispatches to the latest handler', () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ onStatusChange }) => useTaskStatusStream('access-token', onStatusChange),
      { initialProps: { onStatusChange: firstHandler } },
    );

    rerender({ onStatusChange: secondHandler });
    EventSourceStub.instances[0].emit('task-status-updated', { id: 'task-1', status: 'Done' });

    expect(EventSourceStub.instances).toHaveLength(1);
    expect(EventSourceStub.instances[0].url).toBe(`${apiBaseUrl}/tasks/stream?access_token=access-token`);
    expect(EventSourceStub.instances[0].close).not.toHaveBeenCalled();
    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith({ id: 'task-1', status: 'Done' });

    unmount();

    expect(EventSourceStub.instances[0].close).toHaveBeenCalledTimes(1);
  });
});

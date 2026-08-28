import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Component as AuthCallbackPage } from './AuthCallbackPage';

const redirectBridge = vi.hoisted(() => ({
  broadcastResponseToMainFrame: vi.fn()
}));

vi.mock('@azure/msal-browser/redirect-bridge', () => ({
  broadcastResponseToMainFrame: redirectBridge.broadcastResponseToMainFrame
}));

describe('AuthCallbackPage', () => {
  it('broadcasts the Microsoft Entra popup response back to the opener', async () => {
    redirectBridge.broadcastResponseToMainFrame.mockResolvedValue(undefined);

    render(<AuthCallbackPage />);

    await waitFor(() => expect(redirectBridge.broadcastResponseToMainFrame).toHaveBeenCalled());
    expect(screen.getByRole('status')).toHaveTextContent('Completing sign in...');
  });
});

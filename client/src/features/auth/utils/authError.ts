export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { errorMessage?: string; errorCode?: string; message?: string };
    if (maybeError.errorCode && maybeError.errorMessage) {
      return `${maybeError.errorCode}: ${maybeError.errorMessage}`;
    }

    if (maybeError.errorMessage) {
      return maybeError.errorMessage;
    }

    if (maybeError.message) {
      return maybeError.message;
    }
  }

  return 'Unable to complete Microsoft Entra login.';
}

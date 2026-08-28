export interface ClientError {
  code?: string;
  isAuthError: boolean;
  message: string;
  statusCode?: number;
}

interface ErrorEnvelopeLike {
  code?: string;
  errorMessage?: string;
  message?: string;
}

interface ResponseErrorLike {
  data?: unknown;
  message?: string;
  response?: {
    data?: unknown;
    status?: number;
  };
  status?: number;
}

export function normalizeClientError(error: unknown, fallbackMessage = 'Something went wrong.'): ClientError {
  const responseError = error as ResponseErrorLike | null;
  const statusCode = responseError?.status ?? responseError?.response?.status;
  const body = responseError?.data ?? responseError?.response?.data;
  const envelope = readEnvelope(body);
  const message = envelope?.message ?? envelope?.errorMessage ?? readMessage(error) ?? fallbackMessage;

  return {
    code: envelope?.code,
    isAuthError: statusCode === 401 || envelope?.code === 'AUTH_REQUIRED',
    message,
    statusCode,
  };
}

function readEnvelope(value: unknown): ErrorEnvelopeLike | null {
  if (!isRecord(value)) return null;

  return {
    code: typeof value.code === 'string' ? value.code : undefined,
    errorMessage: typeof value.errorMessage === 'string' ? value.errorMessage : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
  };
}

function readMessage(value: unknown) {
  if (value instanceof Error && value.message) return value.message;
  if (!isRecord(value)) return undefined;
  if (typeof value.errorMessage === 'string') return value.errorMessage;
  if (typeof value.message === 'string') return value.message;
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

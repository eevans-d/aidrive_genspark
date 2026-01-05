type ErrorDetails = Record<string, unknown> | string | null;

export class AppError extends Error {
  code: string;
  status: number;
  details?: ErrorDetails;

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500, details?: ErrorDetails) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class HttpError extends AppError {
  constructor(message: string, status = 500, code = 'HTTP_ERROR', details?: ErrorDetails) {
    super(message, code, status, details);
    this.name = 'HttpError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown, fallbackCode = 'INTERNAL_ERROR', status = 500): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, fallbackCode, status);
  }

  return new AppError('Unexpected error', fallbackCode, status, {
    raw: error,
  });
}

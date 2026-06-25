import { NextResponse } from 'next/server';
import { logApiEvent } from '@/lib/api/logging';

type ApiErrorOptions = {
  code?: string;
  details?: Record<string, unknown>;
  headers?: HeadersInit;
  cause?: unknown;
};

export class ApiRouteError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;
  headers?: HeadersInit;
  cause?: unknown;

  constructor(status: number, message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiRouteError';
    this.status = status;
    this.code = options.code;
    this.details = options.details;
    this.headers = options.headers;
    this.cause = options.cause;
  }
}

export function apiError(status: number, message: string, options: ApiErrorOptions = {}) {
  return NextResponse.json(
    {
      error: message,
      code: options.code,
      details: options.details,
    },
    {
      status,
      headers: options.headers,
    }
  );
}

export function apiSuccess<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

export function unauthorized(message = 'Unauthorized') {
  return apiError(401, message, { code: 'unauthorized' });
}

export function handleApiRouteError(
  error: unknown,
  context: string,
  metadata: Record<string, unknown> = {}
) {
  if (error instanceof ApiRouteError) {
    if (error.status >= 500) {
      logApiEvent('error', `${context}.failed`, {
        ...metadata,
        status: error.status,
        code: error.code,
        details: error.details,
        cause: toErrorMessage(error.cause ?? error),
      });
    }

    return apiError(error.status, error.message, {
      code: error.code,
      details: error.details,
      headers: error.headers,
    });
  }

  logApiEvent('error', `${context}.failed`, {
    ...metadata,
    cause: toErrorMessage(error),
  });

  return apiError(500, 'Internal Server Error', { code: 'internal_server_error' });
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : 'Unknown error';
}

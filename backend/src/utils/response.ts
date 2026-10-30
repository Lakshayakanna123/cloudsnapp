import { ApiResponse, ApiErrorResponse } from '../types';

export function successResponse<T>(
  data: T,
  message?: string,
  statusCode = 200
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(payload),
  };
}

export function errorResponse(
  statusCode: number,
  code: string,
  message: string
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const payload: ApiErrorResponse = {
    success: false,
    error: { code, message },
  };
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(payload),
  };
}

function corsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  };
}

export function handleError(err: unknown): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  // Do NOT expose internal error details to the client
  if (err instanceof ValidationError) {
    return errorResponse(400, 'VALIDATION_ERROR', err.message);
  }
  if (err instanceof AuthorizationError) {
    return errorResponse(401, 'UNAUTHORIZED', 'Authentication required');
  }
  if (err instanceof ForbiddenError) {
    return errorResponse(403, 'FORBIDDEN', 'Access denied');
  }
  if (err instanceof NotFoundError) {
    return errorResponse(404, 'NOT_FOUND', err.message);
  }
  if (err instanceof ConflictError) {
    return errorResponse(409, 'CONFLICT', err.message);
  }

  // Log the real error server-side only
  console.error('[ERROR]', {
    message: err instanceof Error ? err.message : 'Unknown error',
    stack: err instanceof Error ? err.stack : undefined,
  });

  return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

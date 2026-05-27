import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { formatSecurityEvent, sanitizeLogPath, sanitizeLogValue } from '../utils/security-log';

interface ErrorBody {
  requestId: string;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  [key: string]: unknown;
}

const MAX_ERROR_MESSAGE_LENGTH = 500;
const ALLOWED_ERROR_EXTRAS = new Set([
  'code',
  'feature',
  'effectivePlan',
  'billingPlan',
  'subscriptionStatus',
  'requiredPlan',
]);

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // X-Request-ID is set by RequestIdMiddleware; fall back gracefully if
    // the middleware hasn't run (e.g. in unit tests or early bootstrap errors).
    const requestId =
      typeof request.headers['x-request-id'] === 'string'
        ? request.headers['x-request-id']
        : 'unknown';

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    const rawMessage: string | string[] =
      exceptionResponse !== null &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : exception instanceof HttpException
            ? exception.message
            : 'Internal server error';

    const message =
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : sanitizeMessage(rawMessage);

    const error: string =
      exceptionResponse !== null &&
      typeof exceptionResponse === 'object' &&
      'error' in exceptionResponse
        ? sanitizeString((exceptionResponse as { error: string }).error)
        : (HttpStatus[status] ?? 'Error');

    const path = sanitizeLogPath(request.originalUrl ?? request.url);

    const extras =
      exceptionResponse !== null &&
      typeof exceptionResponse === 'object' &&
      !Array.isArray(exceptionResponse)
        ? Object.fromEntries(
            Object.entries(exceptionResponse).filter(
              ([key]) =>
                !['statusCode', 'error', 'message'].includes(key) && ALLOWED_ERROR_EXTRAS.has(key),
            ),
          )
        : {};

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        formatSecurityEvent('http.error', {
          requestId,
          method: request.method,
          path,
          statusCode: status,
        }),
        exception instanceof Error ? exception.stack : String(exception),
      );
      // Report server errors to Sentry (no-op when SENTRY_DSN is unset).
      // requestId + route are attached so an error can be traced back to its
      // log line; client (4xx) errors are intentionally not reported.
      Sentry.withScope((scope) => {
        scope.setTag('requestId', requestId);
        scope.setTag('http.method', request.method);
        scope.setContext('request', { path, method: request.method, statusCode: status });
        Sentry.captureException(exception);
      });
    } else {
      const printableMessage = Array.isArray(message) ? message.join(', ') : message;
      this.logger.warn(
        formatSecurityEvent('http.client_error', {
          requestId,
          method: request.method,
          path,
          statusCode: status,
          message: printableMessage,
        }),
      );
    }

    const body: ErrorBody = {
      requestId,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path,
      ...extras,
    };

    response.status(status).json(body);
  }
}

function sanitizeMessage(message: string | string[]): string | string[] {
  if (Array.isArray(message)) return message.map((item) => sanitizeString(item));

  return sanitizeString(message);
}

function sanitizeString(message: string): string {
  return sanitizeLogValue(message).slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

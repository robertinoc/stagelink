import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  [key: string]: unknown;
}

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

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    const message: string | string[] =
      exceptionResponse !== null &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : exception instanceof HttpException
            ? exception.message
            : 'Internal server error';

    const error: string =
      exceptionResponse !== null &&
      typeof exceptionResponse === 'object' &&
      'error' in exceptionResponse
        ? (exceptionResponse as { error: string }).error
        : (HttpStatus[status] ?? 'Error');

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
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      const printableMessage = Array.isArray(message) ? message.join(', ') : message;
      this.logger.warn(`${request.method} ${request.url} → ${status} (${printableMessage})`);
    }

    const body: ErrorBody = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...extras,
    };

    response.status(status).json(body);
  }
}

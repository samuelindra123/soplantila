import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const responseBody =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as Record<string, unknown> | null);

    const message =
      responseBody?.message ?? (isHttpException ? exception.message : 'Internal server error');

    const errorCode =
      typeof responseBody?.error === 'string'
        ? responseBody.error
        : HttpStatus[status] ?? 'Error';

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, { success: true; data: T; message?: string }>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ success: true; data: T; message?: string }> {
    return next.handle().pipe(
      map((value) => {
        if (
          value &&
          typeof value === 'object' &&
          'success' in (value as Record<string, unknown>)
        ) {
          return value as unknown as { success: true; data: T; message?: string };
        }

        if (
          value &&
          typeof value === 'object' &&
          'data' in (value as Record<string, unknown>)
        ) {
          const payload = value as Record<string, unknown>;

          return {
            success: true,
            data: payload.data as T,
            ...(typeof payload.message === 'string'
              ? { message: payload.message }
              : {}),
          };
        }

        return {
          success: true,
          data: value,
        };
      }),
    );
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        console.log(`[TenantInterceptor] Request processed: ${request.method} ${request.url}`);
      }),
    );
  }
}
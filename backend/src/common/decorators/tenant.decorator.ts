import { createParamDecorator, ExecutionContext, NotFoundException } from '@nestjs/common';

export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    if (request.tenant) {
      return request.tenant;
    }
    
    if (request.user?.tenantId) {
      return { tenantId: request.user.tenantId };
    }
    
    console.warn('[Tenant] No tenant found in request. User:', request.user);
    return { tenantId: null };
  },
);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export interface EntityWithTenant {
  tenantId: string;
}
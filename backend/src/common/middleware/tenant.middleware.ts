import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET') || 'oficina360-secret-key',
        });
        req.tenant = { tenantId: payload.tenantId };
        req.user = { userId: payload.sub, role: payload.role };
      } catch {
        // Invalid token, continue without tenant
      }
    }

    next();
  }
}

declare module 'express' {
  interface Request {
    tenant?: { tenantId: string };
    user?: { userId: string; role: string };
  }
}
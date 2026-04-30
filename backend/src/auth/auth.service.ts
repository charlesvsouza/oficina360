import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthTokens, JwtPayload } from './interfaces/auth.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens & { user: any }> {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    const tenantId = uuidv4();
    const userId = uuidv4();

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { name: 'START' },
    });

    if (!plan) {
      throw new Error('START plan not found. Run seed script.');
    }

    const subscriptionId = uuidv4();
    const trialDays = 14;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    await this.prisma.$transaction([
      this.prisma.tenant.create({
        data: {
          id: tenantId,
          name: dto.tenantName || dto.name + "'s Workshop",
          document: dto.document || dto.taxId || '',
          taxId: dto.taxId || dto.document || '',
          companyType: dto.companyType || 'CNPJ',
          legalNature: dto.legalNature || (dto.companyType === 'CPF' ? 'PF' : 'PJ'),
          legalName: dto.legalName || dto.tenantName || dto.name,
          tradeName: dto.tradeName || dto.tenantName || dto.name,
          stateRegistration: dto.stateRegistration,
          municipalRegistration: dto.municipalRegistration,
        },
      }),
      this.prisma.subscription.create({
        data: {
          id: subscriptionId,
          tenantId,
          planId: plan.id,
          status: 'TRIALING',
          trialEndsAt,
          currentPeriodEnd: trialEndsAt,
        },
      }),
      this.prisma.user.create({
        data: {
          id: userId,
          tenantId,
          email: dto.email,
          passwordHash: await bcrypt.hash(dto.password, 10),
          name: dto.name,
          role: 'MASTER',
        },
      }),
    ]);

    return {
      ...this.generateTokens({ sub: userId, email: dto.email, tenantId, role: 'MASTER' }),
      user: { id: userId, email: dto.email, name: dto.name, role: 'MASTER', tenantId },
    };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: { tenant: { include: { subscription: { include: { plan: true } } } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...this.generateTokens({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      }),
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
      tenant: { id: user.tenant.id, name: user.tenant.name, subscription: user.tenant.subscription },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'oficina360-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET') || 'oficina360-secret-key',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET') || 'oficina360-refresh-secret',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
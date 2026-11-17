import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { App } from 'firebase-admin/app';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './current-user.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Verifies the Firebase Bearer token and finds/creates the user in our DB.
 *
 * AUTH_MODE=dev allows working locally without Firebase (we use DEV_USER_ID).
 * This mode is strictly disabled in production: the service refuses requests in dev mode.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private firebaseApp: App | null = null;

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();

    const authUid = await this.resolveAuthUid(request.headers.authorization);
    const user = await this.prisma.user.upsert({
      where: { authUid },
      update: {},
      create: { id: authUid, authUid },
    });

    request.user = { id: user.id, authUid };
    return true;
  }

  private async resolveAuthUid(authorization: string | undefined): Promise<string> {
    const mode = process.env.AUTH_MODE ?? 'firebase';

    if (mode === 'dev') {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('AUTH_MODE=dev is forbidden in production');
      }
      return process.env.DEV_USER_ID ?? 'dev-user-1';
    }

    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) throw new UnauthorizedException('Bearer token required');

    try {
      const { initializeApp, getApps } = await import('firebase-admin/app');
      const { getAuth } = await import('firebase-admin/auth');
      this.firebaseApp ??= getApps()[0] ?? initializeApp();
      const decoded = await getAuth(this.firebaseApp).verifyIdToken(token);
      return decoded.uid;
    } catch (error) {
      this.logger.warn(`Invalid token: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}

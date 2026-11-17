import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  /** Internal user id (key in the User table). */
  id: string;
  authUid: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  return request.user;
});

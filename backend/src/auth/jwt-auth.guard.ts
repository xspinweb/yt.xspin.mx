import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("Token requerido.");
    }

    const payload = this.authService.verifyToken(token);
    request.user = { id: payload.sub, email: payload.email };

    return true;
  }

  private extractToken(request: Request) {
    const authHeader = request.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.slice(7);
    }

    return request.cookies?.ytx_access_token;
  }
}

import { Body, Controller, Get, GoneException, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register() {
    throw new GoneException("El registro con email fue deshabilitado. Usa Google.");
  }

  @Post("login")
  login() {
    throw new GoneException("El inicio de sesion con email fue deshabilitado. Usa Google.");
  }

  @Post("google")
  async google(@Body() payload: GoogleAuthDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.google(payload);
    this.setAuthCookie(response, result.accessToken);
    return result;
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("ytx_access_token");
    return { message: "Sesion cerrada" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }

  private setAuthCookie(response: Response, token: string) {
    response.cookie("ytx_access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });
  }
}

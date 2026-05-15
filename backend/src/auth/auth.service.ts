import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthProvider, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import type { TokenPayload } from "google-auth-library";
import { PrismaService } from "../prisma/prisma.service";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

type PublicUser = Omit<User, "passwordHash"> & {
  hasConnectedChannel: boolean;
};

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async register(payload: RegisterDto) {
    const email = payload.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException("Este email ya esta registrado.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: payload.name.trim(),
        displayName: payload.name.trim(),
        email,
        passwordHash,
        provider: AuthProvider.EMAIL
      },
      include: { channels: true }
    });

    return this.createAuthResponse(user);
  }

  async login(payload: LoginDto) {
    const email = payload.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { channels: true }
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException("Credenciales invalidas.");
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isValid || !user.isActive) {
      throw new UnauthorizedException("Credenciales invalidas.");
    }

    return this.createAuthResponse(user);
  }

  async google(payload: GoogleAuthDto) {
    const googleProfile = await this.verifyGoogleCredential(payload.credential);
    const email = googleProfile.email.toLowerCase().trim();
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        googleId: googleProfile.googleId,
        avatarUrl: googleProfile.avatarUrl,
        provider: AuthProvider.GOOGLE,
        name: googleProfile.name
      },
      create: {
        email,
        name: googleProfile.name,
        displayName: googleProfile.name,
        googleId: googleProfile.googleId,
        avatarUrl: googleProfile.avatarUrl,
        provider: AuthProvider.GOOGLE
      },
      include: { channels: true }
    });

    return this.createAuthResponse(user);
  }

  private async verifyGoogleCredential(credential: string) {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID");

    if (!clientId) {
      throw new UnauthorizedException("Google OAuth no esta configurado.");
    }

    let payload: TokenPayload | undefined;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error("Google credential validation failed", error);
      throw new UnauthorizedException("No pudimos validar la credencial de Google.");
    }

    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException("Credencial de Google invalida.");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      avatarUrl: payload.picture
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { channels: true }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Sesion invalida.");
    }

    return {
      user: this.toPublicUser(user)
    };
  }

  verifyToken(token: string) {
    try {
      const secret = this.config.get<string>("JWT_SECRET", "dev_secret");
      return jwt.verify(token, secret) as { sub: string; email: string };
    } catch {
      throw new UnauthorizedException("Token invalido.");
    }
  }

  private createAuthResponse(user: User & { channels: Array<{ isActive: boolean }> }) {
    const accessToken = this.signToken(user);

    return {
      accessToken,
      user: this.toPublicUser(user)
    };
  }

  private signToken(user: User) {
    const secret = this.config.get<string>("JWT_SECRET", "dev_secret");

    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: "7d" }
    );
  }

  private toPublicUser(user: User & { channels?: Array<{ isActive: boolean }> }): PublicUser {
    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      ...safeUser,
      hasConnectedChannel: Boolean(user.channels?.some((channel: { isActive: boolean }) => channel.isActive))
    };
  }
}

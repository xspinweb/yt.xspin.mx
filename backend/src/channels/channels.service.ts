import { BadGatewayException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ConnectChannelDto } from "./dto/connect-channel.dto";

type Channel = {
  id: string;
  handle: string;
  niche: string;
  detectedVideos: number;
  exposureScore: number;
  status: "pending_sync" | "synced";
};

type YoutubeChannelsResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      customUrl?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly channels: Channel[] = [
    {
      id: "ch_pixel_norte",
      handle: "@PixelNorte",
      niche: "Tecnologia",
      detectedVideos: 12,
      exposureScore: 72,
      status: "synced"
    }
  ];

  findAll() {
    return {
      data: this.channels
    };
  }

  async connect(payload: ConnectChannelDto, ownerUserId: string) {
    const handle = this.normalizeHandle(payload.channelUrl);
    return this.upsertConnectedChannel(ownerUserId, handle, payload.niche, null);
  }

  async connectGoogleOwnedChannel(ownerUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: ownerUserId }
    });

    if (!user?.googleId) {
      throw new UnauthorizedException("Debes iniciar sesion con Google para conectar tu canal de YouTube.");
    }

    const handle = this.createGoogleLinkedHandle(user.email);
    return this.upsertConnectedChannel(ownerUserId, handle, user.niche ?? "Tecnologia", `google:${user.googleId}`);
  }

  async connectYoutubeChannel(accessToken: string, ownerUserId: string) {
    const youtubeChannel = await this.fetchOwnedYoutubeChannel(accessToken);
    const handle = youtubeChannel.handle ?? youtubeChannel.title;
    return this.upsertConnectedChannel(ownerUserId, handle, "Tecnologia", youtubeChannel.id, youtubeChannel.title);
  }

  private async fetchOwnedYoutubeChannel(accessToken: string) {
    const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const data = (await response.json()) as YoutubeChannelsResponse;

    if (!response.ok) {
      throw new BadGatewayException(data.error?.message ?? "No pudimos consultar el canal de YouTube.");
    }

    const channel = data.items?.[0];

    if (!channel?.id) {
      throw new BadGatewayException("Esta cuenta de Google no tiene un canal de YouTube disponible.");
    }

    return {
      id: channel.id,
      title: channel.snippet?.title ?? "Canal de YouTube",
      handle: channel.snippet?.customUrl
    };
  }

  private async upsertConnectedChannel(
    ownerUserId: string,
    handle: string,
    niche: string,
    youtubeChannelId: string | null = null,
    title = handle
  ) {
    const existingChannel = await this.prisma.channel.findFirst({
      where: {
        ownerUserId,
        isActive: true
      }
    });

    const channel = existingChannel
      ? await this.prisma.channel.update({
          where: { id: existingChannel.id },
          data: {
            title,
            handle,
            niche,
            youtubeChannelId,
            language: "es",
            isActive: true
          }
        })
      : await this.prisma.channel.create({
          data: {
            ownerUserId,
            title,
            handle,
            niche,
            youtubeChannelId: youtubeChannelId ?? undefined,
            language: "es",
            isActive: true
          }
        });

    const preview: Channel = {
      id: channel.id,
      handle,
      niche,
      detectedVideos: 0,
      exposureScore: 0,
      status: "pending_sync"
    };

    this.channels.unshift(preview);

    return {
      data: preview,
      message: existingChannel
        ? "Canal actualizado. La sincronizacion real con YouTube se conectara en el siguiente modulo."
        : "Canal recibido. La sincronizacion real con YouTube se conectara en el siguiente modulo."
    };
  }

  private createGoogleLinkedHandle(email: string) {
    const localPart = email.split("@")[0]?.trim() || "canal";
    const safeHandle = localPart.replace(/[^a-zA-Z0-9._-]/g, "");
    return `@${safeHandle}`;
  }

  private normalizeHandle(channelUrl: string) {
    const trimmed = channelUrl.trim();

    if (trimmed.startsWith("@")) {
      return trimmed;
    }

    const handleMatch = trimmed.match(/youtube\.com\/(@[^/?#]+)/i);
    return handleMatch?.[1] ?? trimmed;
  }
}

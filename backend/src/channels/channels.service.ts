import { BadGatewayException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { ConnectChannelDto } from "./dto/connect-channel.dto";

type Channel = {
  id: string;
  handle: string;
  title: string;
  channelUrl: string;
  thumbnailUrl?: string | null;
  subscriberCount?: string | null;
  videoCount?: string | null;
  viewCount?: string | null;
  publishedAt?: Date | null;
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
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    statistics?: {
      hiddenSubscriberCount?: boolean;
      subscriberCount?: string;
      videoCount?: string;
      viewCount?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  private readonly channels: Channel[] = [
    {
      id: "ch_pixel_norte",
      handle: "@PixelNorte",
      title: "PixelNorte",
      channelUrl: "https://www.youtube.com/@PixelNorte",
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
    const metadata = await this.resolvePublicChannel(payload.channelUrl);
    return this.upsertConnectedChannel(ownerUserId, metadata, payload.niche, null);
  }

  async connectGoogleOwnedChannel(ownerUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: ownerUserId }
    });

    if (!user?.googleId) {
      throw new UnauthorizedException("Debes iniciar sesion con Google para conectar tu canal de YouTube.");
    }

    const handle = this.createGoogleLinkedHandle(user.email);
    return this.upsertConnectedChannel(
      ownerUserId,
      {
        handle,
        title: handle,
        channelUrl: `https://www.youtube.com/${handle}`
      },
      user.niche ?? "Tecnologia",
      `google:${user.googleId}`
    );
  }

  async connectYoutubeChannel(accessToken: string, ownerUserId: string) {
    const youtubeChannel = await this.fetchOwnedYoutubeChannel(accessToken);
    const handle = youtubeChannel.handle ?? youtubeChannel.title;
    return this.upsertConnectedChannel(
      ownerUserId,
      {
        handle,
        title: youtubeChannel.title,
        channelUrl: `https://www.youtube.com/${handle}`
      },
      "Tecnologia",
      youtubeChannel.id
    );
  }

  private async resolvePublicChannel(channelUrl: string) {
    const fallback = this.normalizeChannelInput(channelUrl);
    const apiKey = this.config.get<string>("YOUTUBE_API_KEY");

    if (!apiKey) {
      return fallback;
    }

    const params = new URLSearchParams({
      part: "snippet,statistics",
      key: apiKey
    });

    if (fallback.youtubeChannelId) {
      params.set("id", fallback.youtubeChannelId);
    } else {
      params.set("forHandle", fallback.handle.replace("@", ""));
    }

    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params.toString()}`);
    const data = (await response.json()) as YoutubeChannelsResponse;

    if (!response.ok) {
      throw new BadGatewayException(data.error?.message ?? "No pudimos consultar el canal publico de YouTube.");
    }

    const channel = data.items?.[0];

    if (!channel?.id) {
      throw new BadGatewayException("No encontramos un canal publico con esa URL.");
    }

    const customUrl = channel.snippet?.customUrl;
    const handle = customUrl?.startsWith("@") ? customUrl : fallback.handle;

    return {
      youtubeChannelId: channel.id,
      handle,
      title: channel.snippet?.title ?? handle,
      channelUrl: `https://www.youtube.com/${handle}`,
      thumbnailUrl:
        channel.snippet?.thumbnails?.high?.url ??
        channel.snippet?.thumbnails?.medium?.url ??
        channel.snippet?.thumbnails?.default?.url,
      subscriberCount: channel.statistics?.hiddenSubscriberCount ? null : channel.statistics?.subscriberCount ?? null,
      videoCount: channel.statistics?.videoCount ?? null,
      viewCount: channel.statistics?.viewCount ?? null,
      publishedAt: channel.snippet?.publishedAt ? new Date(channel.snippet.publishedAt) : null
    };
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

  private async upsertConnectedChannel(ownerUserId: string, metadata: Omit<Channel, "id" | "niche" | "detectedVideos" | "exposureScore" | "status"> & { youtubeChannelId?: string | null }, niche: string, youtubeChannelId: string | null = null) {
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
            title: metadata.title,
            handle: metadata.handle,
            channelUrl: metadata.channelUrl,
            thumbnailUrl: metadata.thumbnailUrl,
            subscriberCount: metadata.subscriberCount,
            videoCount: metadata.videoCount,
            viewCount: metadata.viewCount,
            publishedAt: metadata.publishedAt,
            niche,
            youtubeChannelId: youtubeChannelId ?? metadata.youtubeChannelId ?? null,
            language: "es",
            isActive: true
          }
        })
      : await this.prisma.channel.create({
          data: {
            ownerUserId,
            title: metadata.title,
            handle: metadata.handle,
            channelUrl: metadata.channelUrl,
            thumbnailUrl: metadata.thumbnailUrl,
            subscriberCount: metadata.subscriberCount,
            videoCount: metadata.videoCount,
            viewCount: metadata.viewCount,
            publishedAt: metadata.publishedAt,
            niche,
            youtubeChannelId: youtubeChannelId ?? metadata.youtubeChannelId ?? undefined,
            language: "es",
            isActive: true
          }
        });

    const preview: Channel = {
      id: channel.id,
      handle: metadata.handle,
      title: metadata.title,
      channelUrl: metadata.channelUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      subscriberCount: metadata.subscriberCount,
      videoCount: metadata.videoCount,
      viewCount: metadata.viewCount,
      publishedAt: metadata.publishedAt,
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

  private normalizeChannelInput(channelUrl: string) {
    const trimmed = channelUrl.trim();

    if (trimmed.startsWith("@")) {
      return {
        handle: trimmed,
        title: trimmed,
        channelUrl: `https://www.youtube.com/${trimmed}`
      };
    }

    const handleMatch = trimmed.match(/youtube\.com\/(@[^/?#]+)/i);
    const channelIdMatch = trimmed.match(/youtube\.com\/channel\/([^/?#]+)/i);
    const handle = handleMatch?.[1] ?? trimmed.replace(/^https?:\/\/(www\.)?youtube\.com\//i, "");

    return {
      youtubeChannelId: channelIdMatch?.[1],
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      title: handle.startsWith("@") ? handle : `@${handle}`,
      channelUrl: trimmed.startsWith("http") ? trimmed : `https://www.youtube.com/${handle}`
    };
  }
}

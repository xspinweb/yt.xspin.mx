import { BadGatewayException, Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
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

type ChannelMetadata = Omit<Channel, "id" | "niche" | "detectedVideos" | "exposureScore" | "status"> & {
  youtubeChannelId?: string | null;
  uploadsPlaylistId?: string | null;
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
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
  error?: {
    message?: string;
  };
};

type YoutubePlaylistItemsResponse = {
  nextPageToken?: string;
  items?: Array<{
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
      resourceId?: {
        videoId?: string;
      };
    };
    contentDetails?: {
      videoId?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type YoutubeVideosResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    contentDetails?: {
      duration?: string;
    };
    statistics?: {
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

  async findMyVideos(ownerUserId: string) {
    let channel = await this.findActiveChannelWithVideos(ownerUserId);
    const expectedVideoCount = Number(channel?.videoCount ?? 0);

    if (channel?.youtubeChannelId && (channel.videos.length === 0 || (expectedVideoCount > 0 && channel.videos.length < expectedVideoCount))) {
      const uploadsPlaylistId = await this.resolveUploadsPlaylistId(channel.youtubeChannelId);
      await this.syncPublicVideos(channel.id, uploadsPlaylistId, channel.niche ?? "Tecnologia");
      channel = await this.findActiveChannelWithVideos(ownerUserId);
    }

    if (!channel) {
      return {
        data: {
          videos: [],
          shorts: []
        }
      };
    }

    const formattedVideos = channel.videos.map((video) => ({
      id: video.id,
      youtubeVideoId: video.youtubeVideoId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      durationSec: video.durationSec,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt,
      url: video.youtubeVideoId ? `https://www.youtube.com/watch?v=${video.youtubeVideoId}` : null
    }));

    return {
      data: {
        videos: formattedVideos.filter((video) => !video.durationSec || video.durationSec > 60),
        shorts: formattedVideos.filter((video) => video.durationSec && video.durationSec <= 60)
      }
    };
  }

  private findActiveChannelWithVideos(ownerUserId: string) {
    return this.prisma.channel.findFirst({
      where: {
        ownerUserId,
        isActive: true
      },
      include: {
        videos: {
          where: { isActive: true },
          orderBy: { publishedAt: "desc" }
        }
      }
    });
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
      throw new ServiceUnavailableException("Falta configurar YOUTUBE_API_KEY para leer datos reales del canal.");
    }

    const params = new URLSearchParams({
      part: "snippet,statistics,contentDetails",
      key: apiKey
    });

    if (fallback.youtubeChannelId) {
      params.set("id", fallback.youtubeChannelId);
    } else {
      params.set("forHandle", fallback.handle);
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
      publishedAt: channel.snippet?.publishedAt ? new Date(channel.snippet.publishedAt) : null,
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads ?? null
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

  private async upsertConnectedChannel(ownerUserId: string, metadata: ChannelMetadata, niche: string, youtubeChannelId: string | null = null) {
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

    const detectedVideos = await this.syncPublicVideos(channel.id, metadata.uploadsPlaylistId, niche);

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
      detectedVideos,
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

  private async syncPublicVideos(channelId: string, uploadsPlaylistId: string | null | undefined, niche: string) {
    const apiKey = this.config.get<string>("YOUTUBE_API_KEY");

    if (!apiKey || !uploadsPlaylistId) {
      return 0;
    }

    const videoIds = await this.fetchAllUploadVideoIds(uploadsPlaylistId, apiKey);

    if (!videoIds.length) {
      return 0;
    }

    let syncedCount = 0;

    for (const videoIdChunk of chunk(videoIds, 50)) {
      const videosParams = new URLSearchParams({
        part: "snippet,contentDetails,statistics",
        id: videoIdChunk.join(","),
        key: apiKey
      });
      const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`);
      const videosData = (await videosResponse.json()) as YoutubeVideosResponse;

      if (!videosResponse.ok) {
        throw new BadGatewayException(videosData.error?.message ?? "No pudimos consultar los detalles de los videos.");
      }

      await Promise.all((videosData.items ?? []).map((video) => this.upsertPublicVideo(channelId, video, niche)));
      syncedCount += videosData.items?.length ?? 0;
    }

    return syncedCount;
  }

  private async fetchAllUploadVideoIds(uploadsPlaylistId: string, apiKey: string) {
    const videoIds: string[] = [];
    let nextPageToken: string | undefined;

    do {
      const playlistParams = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: "50",
        key: apiKey
      });

      if (nextPageToken) {
        playlistParams.set("pageToken", nextPageToken);
      }

      const playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${playlistParams.toString()}`);
      const playlistData = (await playlistResponse.json()) as YoutubePlaylistItemsResponse;

      if (!playlistResponse.ok) {
        throw new BadGatewayException(playlistData.error?.message ?? "No pudimos consultar los videos publicos del canal.");
      }

      videoIds.push(
        ...(playlistData.items
          ?.map((item) => item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId)
          .filter((videoId): videoId is string => Boolean(videoId)) ?? [])
      );
      nextPageToken = playlistData.nextPageToken;
    } while (nextPageToken);

    return [...new Set(videoIds)];
  }

  private upsertPublicVideo(channelId: string, video: NonNullable<YoutubeVideosResponse["items"]>[number], niche: string) {
    const videoData = {
      channelId,
      title: video.snippet?.title ?? "Video de YouTube",
      thumbnailUrl:
        video.snippet?.thumbnails?.maxres?.url ??
        video.snippet?.thumbnails?.high?.url ??
        video.snippet?.thumbnails?.medium?.url ??
        video.snippet?.thumbnails?.default?.url,
      durationSec: parseYoutubeDuration(video.contentDetails?.duration),
      viewCount: video.statistics?.viewCount ?? null,
      publishedAt: video.snippet?.publishedAt ? new Date(video.snippet.publishedAt) : null,
      niche,
      language: "es",
      isActive: true
    };

    return this.prisma.video.upsert({
      where: { youtubeVideoId: video.id },
      update: videoData,
      create: {
        ...videoData,
        youtubeVideoId: video.id
      }
    });
  }

  private async resolveUploadsPlaylistId(youtubeChannelId: string) {
    const apiKey = this.config.get<string>("YOUTUBE_API_KEY");

    if (!apiKey) {
      throw new ServiceUnavailableException("Falta configurar YOUTUBE_API_KEY para sincronizar videos del canal.");
    }

    const params = new URLSearchParams({
      part: "contentDetails",
      id: youtubeChannelId,
      key: apiKey
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params.toString()}`);
    const data = (await response.json()) as YoutubeChannelsResponse;

    if (!response.ok) {
      throw new BadGatewayException(data.error?.message ?? "No pudimos consultar la lista de uploads del canal.");
    }

    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
  }
}

function parseYoutubeDuration(duration?: string) {
  if (!duration) {
    return null;
  }

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  return hours * 3600 + minutes * 60 + seconds;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

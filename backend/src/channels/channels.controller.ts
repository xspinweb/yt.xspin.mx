import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ChannelsService } from "./channels.service";
import { ConnectChannelDto } from "./dto/connect-channel.dto";
import { ConnectYoutubeChannelDto } from "./dto/connect-youtube-channel.dto";

@Controller("channels")
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  @Post("connect")
  @UseGuards(JwtAuthGuard)
  connect(@Body() payload: ConnectChannelDto, @CurrentUser() user: { id: string }) {
    return this.channelsService.connect(payload, user.id);
  }

  @Post("connect-google")
  @UseGuards(JwtAuthGuard)
  connectGoogle(@CurrentUser() user: { id: string }) {
    return this.channelsService.connectGoogleOwnedChannel(user.id);
  }

  @Post("connect-youtube")
  @UseGuards(JwtAuthGuard)
  connectYoutube(@Body() payload: ConnectYoutubeChannelDto, @CurrentUser() user: { id: string }) {
    return this.channelsService.connectYoutubeChannel(payload.accessToken, user.id);
  }
}

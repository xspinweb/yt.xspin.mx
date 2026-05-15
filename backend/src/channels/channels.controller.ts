import { Body, Controller, Get, GoneException, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ChannelsService } from "./channels.service";
import { ConnectChannelDto } from "./dto/connect-channel.dto";

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
  connectGoogle() {
    throw new GoneException("La conexion por cuenta de Google fue deshabilitada. Conecta el canal por URL publica.");
  }

  @Post("connect-youtube")
  @UseGuards(JwtAuthGuard)
  connectYoutube() {
    throw new GoneException("La conexion por OAuth de YouTube fue deshabilitada. Conecta el canal por URL publica.");
  }
}

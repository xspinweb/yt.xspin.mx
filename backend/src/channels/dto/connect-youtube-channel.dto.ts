import { IsString, MinLength } from "class-validator";

export class ConnectYoutubeChannelDto {
  @IsString()
  @MinLength(20)
  accessToken!: string;
}

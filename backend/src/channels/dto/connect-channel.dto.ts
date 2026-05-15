import { IsIn, IsString, MinLength } from "class-validator";

const niches = ["Tecnologia", "Gaming", "Educacion", "Musica", "Lifestyle"] as const;

export class ConnectChannelDto {
  @IsString()
  @MinLength(3)
  channelUrl!: string;

  @IsIn(niches)
  niche!: (typeof niches)[number];
}

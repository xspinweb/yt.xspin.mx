import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChannelsModule } from "./channels/channels.module";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PrismaModule,
    AuthModule,
    ChannelsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}

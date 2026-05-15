import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "yt.xspin API",
      timestamp: new Date().toISOString()
    };
  }
}

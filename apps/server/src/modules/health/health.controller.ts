import { Controller, Get } from '@nestjs/common';
import { RedisHealthService } from '../../queue/redis-health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly redisHealthService: RedisHealthService) {}

  @Get()
  async getHealth() {
    const redisHealth = await this.redisHealthService.getHealth();
    
    return {
      status: redisHealth.status === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'healthy',
          message: 'API is running',
        },
        redis: redisHealth,
      },
    };
  }
}

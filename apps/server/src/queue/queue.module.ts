import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisHealthService } from './redis-health.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          tls: configService.get('REDIS_TLS') === 'true' ? {} : undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'media-upload',
    }),
  ],
  providers: [RedisHealthService],
  exports: [BullModule, RedisHealthService],
})
export class QueueModule {}

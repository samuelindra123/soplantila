import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthService implements OnModuleInit {
  private readonly logger = new Logger(RedisHealthService.name);
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.checkRedisConnection();
  }

  private async checkRedisConnection(): Promise<void> {
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
    const redisTls = this.configService.get<string>('REDIS_TLS') === 'true';

    this.logger.log('🔄 Checking Redis connection...');
    this.logger.log(`📍 Host: ${redisHost}:${redisPort}`);
    this.logger.log(`🔐 TLS: ${redisTls ? 'Enabled' : 'Disabled'}`);

    try {
      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        tls: redisTls ? {} : undefined,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error('❌ Redis connection failed after 3 retries');
            return null;
          }
          const delay = Math.min(times * 200, 2000);
          this.logger.warn(`⚠️  Retry ${times}/3 in ${delay}ms...`);
          return delay;
        },
      });

      // Test connection with ping
      const pong = await this.redisClient.ping();
      
      if (pong === 'PONG') {
        this.logger.log('✅ Redis connected successfully!');
        this.logger.log('🚀 Queue system ready');
        
        // Get Redis info
        const info = await this.redisClient.info('server');
        const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
        if (version) {
          this.logger.log(`📦 Redis version: ${version}`);
        }
      }

      // Disconnect test client (Bull will create its own connections)
      await this.redisClient.quit();
      
    } catch (error) {
      this.logger.error('❌ Redis connection FAILED!');
      this.logger.error(`💥 Error: ${error.message}`);
      this.logger.error('');
      this.logger.error('🔧 Troubleshooting:');
      this.logger.error('   1. Check REDIS_HOST in .env');
      this.logger.error('   2. Check REDIS_PASSWORD in .env');
      this.logger.error('   3. Verify Upstash database is active');
      this.logger.error('   4. Check network/firewall settings');
      this.logger.error('');
      this.logger.error('📖 See: apps/server/REDIS_SETUP.md');
      this.logger.error('');
      
      // Throw error to prevent server from starting
      throw new Error(
        `Redis connection failed: ${error.message}. ` +
        'Server cannot start without Redis. Please check your configuration.'
      );
    }
  }

  async getHealth(): Promise<{ status: string; message: string }> {
    try {
      const testClient = new Redis({
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
        password: this.configService.get<string>('REDIS_PASSWORD'),
        tls: this.configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
      });

      const pong = await testClient.ping();
      await testClient.quit();

      if (pong === 'PONG') {
        return {
          status: 'healthy',
          message: 'Redis connection is active',
        };
      }

      return {
        status: 'unhealthy',
        message: 'Redis ping failed',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
      };
    }
  }
}

import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigService, ConfigModule } from "@nestjs/config";
@Module({
    imports: [BullModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
           connection: {
            host: configService.getOrThrow<string>('REDIS_HOST') || '127.0.0.1',
            port: Number(configService.getOrThrow<string>('REDIS_PORT') || '6379'),
            password: configService.getOrThrow<string>('REDIS_PASSWORD'),
            tls: {}
           }
        })
    })]
})
export class RedisModule {
     
}
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigService, ConfigModule } from "@nestjs/config";
@Module({
    imports: [BullModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
           connection: {
            host: configService.getOrThrow<string>('REDIS_HOST'),
            port: Number(configService.getOrThrow<string>('REDIS_PORT'))
           }
        })
    })]
})
export class RedisModule {
     
}
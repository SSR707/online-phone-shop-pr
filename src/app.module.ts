import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { GuardModule } from './guard/guard.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guard/auth.guard';
import { RolesGuard } from './guard/role.guard';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from '@nestjs-modules/ioredis';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { OrderProductModule } from './order-product/order-product.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 3000,
        limit: 4,
      },
    ]),
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          port: configService.get<number>('SMTP_PORT'),
          secure: false,
          auth: {
            user: configService.get<string>('USER_MAIL'),
            pass: configService.get<string>('USER_MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get<string>('SMTP_USER'),
        },
      }),
    }),
    JwtModule.register({}),
    AuthModule,
    GuardModule,
    EmailModule,
    ConfigModule,
    UserModule,
    OrderModule,
    OrderProductModule,
    ProductModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailModule } from 'src/email/email.module';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';
import { EmailService } from 'src/email/email.service';
import { CustomJwtService } from 'src/custom-jwt/custom-jwt.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports:[EmailModule, CustomJwtModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}

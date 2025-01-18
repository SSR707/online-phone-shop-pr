import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CustomJwtService } from 'src/custom-jwt/custom-jwt.service';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { VerifyUserDto } from './dto/verifyUser-auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly customJwtService: CustomJwtService,
  ) {}
  async register(registerhDto: RegisterDto) {
    const currentUser = await this.prismaService.user.findUnique({
      where: { email: registerhDto.email },
    });
    if (currentUser) {
      throw new HttpException(
        'User with this email already exists',
        HttpStatus.CONFLICT,
      );
    }
    const salt = await bcrypt.genSalt();
    registerhDto.password = await bcrypt.hash(registerhDto.password, salt);
    const otp = Math.floor(Math.random() * 100000) + 1;
    await this.emailService.sendActivedOtp(registerhDto.email, 'otp', otp);
    await this.prismaService.user.create({ data: registerhDto });
    await this.prismaService.otp.create({
      data: {
        email: registerhDto.email,
        otp: otp,
        expire_at: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    return { status: HttpStatus.CREATED, message: 'Created' };
  }

  async login(loginDto: LoginDto) {
    const currentUser = await this.prismaService.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!currentUser) {
      throw new HttpException('User NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (currentUser.is_active === false) {
      throw new HttpException('User Is Not Actived', HttpStatus.UNAUTHORIZED);
    }
    const isEqual = await bcrypt.compare(
      loginDto.password,
      currentUser.password,
    );
    if (!isEqual) {
      throw new HttpException(
        'You have entered an invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const accessToken =
      await this.customJwtService.generateAccessToken(currentUser);
    const refreshToken =
      await this.customJwtService.generateRefreshToken(currentUser);
    return { refreshToken, accessToken };
  }

  async verifyUser(verifyUserDto: VerifyUserDto) {
    const currentUser = await this.prismaService.user.findUnique({
      where: { email: verifyUserDto.email },
    });
    if (!currentUser) {
      throw new HttpException('User NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const currentOtp = await this.prismaService.otp.findFirst({
      where: { email: verifyUserDto.email },
    });
    if (!currentOtp) {
      throw new HttpException('invalid otp', HttpStatus.UNAUTHORIZED);
    }
    if (new Date() > currentOtp.expire_at) {
      throw new HttpException('invalid otp', HttpStatus.UNAUTHORIZED);
    }
    if (currentOtp.otp !== +verifyUserDto.otp_code) {
      throw new HttpException('invalid otp', HttpStatus.UNAUTHORIZED);
    }
    await this.prismaService.otp.delete({ where: { id: currentOtp.id } });
    await this.prismaService.user.update({
      where: { id: currentUser.id },
      data: { is_active: true },
    });
    return { status: HttpStatus.OK, message: 'User is Actived' };
  }
}

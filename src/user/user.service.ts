import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProfile(user) {
    return this.prismaService.user.findUnique({ where: { id: user.id } });
  }

  async findAll(page: number, limit: number, search: string) {
    const offsate = (page - 1) * limit;
    return this.prismaService.user.findMany({
      where: {
        OR: [
          { fullname: { contains: search, mode: 'insensitive' } },
          { age: { equals: +search } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      },
      skip: offsate,
      take: limit,
    });
  }

  async findOne(id: number) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    await this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
    return { status: HttpStatus.OK, message: 'User is Updated' };
  }

  async remove(id: number) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    await this.prismaService.user.delete({ where: { id } });
    return { status: HttpStatus.OK, message: 'User is Deleted' };
  }
}

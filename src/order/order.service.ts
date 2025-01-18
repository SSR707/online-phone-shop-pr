import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  async create(createOrderDto: CreateOrderDto, id: number) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const result = await this.prismaService.order.create({
      data: {
        ...createOrderDto,
        userId: user.id,
      },
    });
    await this.redis.set(String(result.id), JSON.stringify(result));
    return { status: HttpStatus.CREATED, message: 'Created' };
  }

  async findAll(page: number, limit: number, search: string) {
    const offset = (page - 1) * limit;
    let redisKey = `order_${page}_${limit}_${search}`;

    const redisData = await this.redis.get(redisKey);
    if (redisData) {
      return JSON.parse(redisData);
    } else {
      const orders = await this.prismaService.order.findMany({
        where: {
          AND: [
            search
              ? {
                  total_price: {
                    equals: parseFloat(search),
                  },
                }
              : {},
          ],
        },
        skip: offset,
        take: limit,
        include: {
          user: true,
          OrderProduct:true
        },
      });

      await this.redis.set(redisKey, JSON.stringify(orders), 'EX', 60 * 60);

      return orders;
    }
  }

  async findOne(id: number) {
    const order = await this.prismaService.order.findFirst({
      where: { id },
      include: { user: true },
    });
    if (!order) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.prismaService.order.findUnique({ where: { id } });
    if (!order) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    await this.prismaService.order.update({
      where: { id },
      data: updateOrderDto,
    });
    return { status: HttpStatus.OK, message: 'Order is Updated' };
  }

  async remove(id: number) {
    const order = await this.prismaService.order.findUnique({ where: { id } });
    if (!order) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    await this.prismaService.order.delete({ where: { id } });
    return { status: HttpStatus.OK, message: 'Order is Deleted' };
  }
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrderProductDto } from './dto/create-order-product.dto';
import { UpdateOrderProductDto } from './dto/update-order-product.dto';
import { OrderProduct } from './entities/order-product.entity';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Order } from 'src/order/entities/order.entity';
import { Product_enum } from 'src/common/enums/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderProductService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  async create(createOrderProductDto: CreateOrderProductDto) {
    const order = await this.prismaService.order.findFirst({
      where: { id: createOrderProductDto.orderId },
    });
    const product = await this.prismaService.product.findFirst({
      where: { id: createOrderProductDto.productId },
    });

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.BAD_REQUEST);
    }

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.BAD_REQUEST);
    }
    await this.prismaService.product.update({
      where: { id: product.id },
      data: { status: 'SOLD' },
    });
    const result = await this.prismaService.orderProduct.create({
      data: {
        orderId: createOrderProductDto.orderId,
        productId: createOrderProductDto.productId,
      },
    });
    await this.redis.set(String(result.id), JSON.stringify(result));
    return { status: HttpStatus.CREATED, message: 'Created' };
  }

  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    let redisKey = `orderProducts_${page}_${limit}`;

    const redisData = await this.redis.get(redisKey);
    if (redisData) {
      return JSON.parse(redisData);
    } else {
      const orderProducts = await this.prismaService.orderProduct.findMany({
        skip: offset,
        take: limit,
        include: {
          order: true,
          product: true,
        },
      });

      await this.redis.set(
        redisKey,
        JSON.stringify(orderProducts),
        'EX',
        60 * 60,
      );

      return orderProducts;
    }
  }

  async findOne(id: number) {
    const orderProduct = await this.prismaService.orderProduct.findFirst({
      where: { id },
      include: { order: true, product: true },
    });
    if (!orderProduct) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return orderProduct;
  }

  async update(id: number, updateOrderProductDto: UpdateOrderProductDto) {
    const orderProduct = await this.prismaService.orderProduct.findFirst({
      where: { id },
    });
    if (!orderProduct) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    await this.prismaService.orderProduct.update({
      where: { id: id },
      data: updateOrderProductDto,
    });

    return { status: HttpStatus.OK, message: 'Order Product is Updated' };
  }

  async remove(id: number) {
    const orderProduct = await this.prismaService.orderProduct.findUnique({
      where: { id },
    });
    if (!orderProduct) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    await this.prismaService.orderProduct.delete({ where: { id } });
    return { status: HttpStatus.OK, message: 'Order Product is Deleted' };
  }
}

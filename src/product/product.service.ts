import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Product_enum } from 'src/common/enums/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  async create(createProductDto: CreateProductDto) {
    const result = await this.prismaService.product.create({
      data: createProductDto,
    });
    await this.redis.set(String(result.id), JSON.stringify(result));
    return { status: HttpStatus.CREATED, message: 'Created' };
  }

  async findAll(page: number, limit: number, search: string) {
    const offset = (page - 1) * limit;
    let redisKey = `products_${page}_${limit}_${search}`;

    const redisData = await this.redis.get(redisKey);
    if (redisData) {
      return JSON.parse(redisData);
    } else {
      const products = await this.prismaService.product.findMany({
        where: {
          status: 'ACTIVE',
          AND: search
            ? [
                {
                  OR: [
                    {
                      name: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      info: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              ]
            : [],
        },
        skip: offset,
        take: limit,
        include: {
          OrderProduct: true,
        },
      });

      await this.redis.set(redisKey, JSON.stringify(products), 'EX', 60 * 60);

      return products;
    }
  }

  async findOne(id: number) {
    const product = await this.prismaService.product.findFirst({
      where: { id, status: 'ACTIVE' },
      include: { OrderProduct: true },
    });
    if (!product) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.prismaService.product.findFirst({
      where: { id, status: 'ACTIVE' },
    });
    if (!product) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    await this.prismaService.product.update({
      where: { id },
      data: UpdateProductDto,
    });
    return { status: HttpStatus.OK, message: 'Product is Updated' };
  }

  async remove(id: number) {
    const product = await this.prismaService.product.findFirst({
      where: { id, status: 'ACTIVE' },
    });
    if (!product) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    await this.prismaService.product.delete({ where: { id } });
    return { status: HttpStatus.OK, message: 'Product is Deleted' };
  }
}

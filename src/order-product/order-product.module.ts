import { Module } from '@nestjs/common';
import { OrderProductService } from './order-product.service';
import { OrderProductController } from './order-product.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [OrderProductController],
  providers: [OrderProductService, PrismaService],
})
export class OrderProductModule {}

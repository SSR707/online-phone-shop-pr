import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Product_enum } from 'src/common/enums/enums';

export class CreateProductDto {
  @ApiProperty({
    type: String,
    description: 'Producet Name',
    example: 'Apple',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: Number,
    description: 'Product Price',
    example: 1000,
  })
  @IsString()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    type: String,
    description: 'Product info',
    example: 'new',
  })
  @IsString()
  @IsNotEmpty()
  info: string;

  @ApiProperty({
    type: Number,
    description: 'Product Quantity',
    example: 100,
  })
  @IsString()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    type: String,
    description: 'Order Status',
    example: Product_enum,
    enum: Product_enum,
  })
  @IsString()
  status: Product_enum;
}

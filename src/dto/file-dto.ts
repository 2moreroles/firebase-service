import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    description: 'The file to be uploaded',
    type: 'string',
    format: 'binary',
  })
  file: any;

  @ApiProperty({
    description: 'Custom destination path for the file',
    required: false,
    example: 'uploads',
    default: 'uploads',
  })
  destinationPath?: string;

  @ApiProperty({
    description: 'Width to resize the image to',
    required: false,
    example: 1,
  })
  resizeWidth?: number;

  @ApiProperty({
    description: 'Height to resize the image to',
    required: false,
    example: 1,
  })
  resizeHeight?: number;

  @ApiProperty({
    description: 'The quality of the image compression (1-100)',
    required: false,
    example: 1,
  })
  quality?: number;
}

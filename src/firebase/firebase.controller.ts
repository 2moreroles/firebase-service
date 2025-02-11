import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from 'src/dto/file-dto';

@Controller('firebase')
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to Firebase Storage' })
  @ApiResponse({
    status: 201,
    description: 'The file has been successfully uploaded',
    schema: {
      type: 'object',
      properties: {
        fileUrl: {
          type: 'string',
          description: 'The URL of the uploaded file',
        },
      },
      example: {
        fileUrl:
          'https://storage.googleapis.com/your-bucket/uploads/some-file.jpg',
      },
    },
  })
  @ApiConsumes('multipart/form-data') // Indicates file upload with form data
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, // Get file from the request
    @Body() uploadFileDto: UploadFileDto, // Additional parameters for the upload
  ): Promise<{ fileUrl: string }> {
    try {
      // Upload the file and get the URL
      const fileUrl = await this.firebaseService.uploadFile(
        file,
        uploadFileDto,
      );
      if (fileUrl) {
        // Return the file URL in the expected JSON format
        return { fileUrl };
      }
      // If fileUrl is undefined or null, you can return an error message or empty object
      throw new Error('File upload failed');
    } catch (error) {
      // Log and throw the error with a custom message
      throw new Error(`Error uploading file: ${error.message}`);
    }
  }
}

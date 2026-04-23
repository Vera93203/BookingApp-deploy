import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, UploadedFiles, Param, Delete, Body,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PropertiesService } from '../properties/properties.service';
import { memoryStorage } from 'multer';

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
};

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(
    private uploadsService: UploadsService,
    private propertiesService: PropertiesService,
  ) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.uploadsService.uploadFile(file, 'avatars');
    return { success: true, ...result };
  }

  @Post('property/:propertyId')
  @ApiOperation({ summary: 'Upload property images (max 10); attaches URLs to the property' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadPropertyImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') userId: string,
  ) {
    const results = await this.uploadsService.uploadMultiple(files, 'properties');
    const urls = results.map((r) => r.url);
    const property = await this.propertiesService.appendPartnerPropertyImages(
      propertyId,
      userId,
      urls,
    );
    return { success: true, images: results, property };
  }

  @Post('room/:roomId')
  @ApiOperation({ summary: 'Upload room images (max 10)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadRoomImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('roomId') roomId: string,
  ) {
    const results = await this.uploadsService.uploadMultiple(files, 'rooms');
    return { success: true, images: results };
  }

  @Post('document')
  @ApiOperation({ summary: 'Upload a document (license, ID, etc.)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadsService.uploadFile(file, 'documents');
    return { success: true, ...result };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete an uploaded file' })
  async deleteFile(@Body('url') url: string) {
    const deleted = await this.uploadsService.deleteFile(url);
    return { success: deleted };
  }
}

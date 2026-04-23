import {
  Injectable, Logger, BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3003');

    // Ensure upload directories exist
    const dirs = ['avatars', 'properties', 'rooms', 'documents'];
    for (const dir of dirs) {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
    this.logger.log('Upload directories initialized');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: 'avatars' | 'properties' | 'rooms' | 'documents',
  ): Promise<UploadResult> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Generate unique filename
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, folder, filename);

    // Save file
    try {
      fs.writeFileSync(filePath, file.buffer);

      const url = `${this.baseUrl}/uploads/${folder}/${filename}`;
      this.logger.log(`File uploaded: ${folder}/${filename} (${(file.size / 1024).toFixed(1)}KB)`);

      return {
        url,
        filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error('File upload failed', error);
      throw new BadRequestException('File upload failed');
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: 'avatars' | 'properties' | 'rooms' | 'documents',
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files per upload');
    }

    const results: UploadResult[] = [];
    for (const file of files) {
      const result = await this.uploadFile(file, folder);
      results.push(result);
    }

    return results;
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extract path from URL
      const urlPath = new URL(fileUrl).pathname;
      const filePath = path.join(process.cwd(), urlPath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`File deleted: ${urlPath}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('File deletion failed', error);
      return false;
    }
  }
}

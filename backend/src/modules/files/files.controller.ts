import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ApiRequest, Operation, Public } from '../../common/actor';
import { ContractsService } from '../../infrastructure/http/contracts.service';
import { FilesService } from './files.service';
import { UploadBytes } from './file-validation';
@Controller('files')
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly contracts: ContractsService,
  ) {}
  @Post('uploads')
  @HttpCode(202)
  @Operation('uploadFile')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024, files: 1, fields: 3, parts: 4 },
    }),
  )
  upload(@Req() r: ApiRequest, @UploadedFile() file: UploadBytes) {
    this.contracts.schema('FileUploadInput', { ...r.body, file: 'binary' });
    return this.files.upload(r, file);
  }
  @Get(':fileId/status') @Operation('getFileStatus') status(@Req() r: ApiRequest) {
    return this.files.getFileStatus(r);
  }
  @Public() @Get(':fileId/download') @Operation('downloadFile') async download(
    @Req() r: ApiRequest,
    @Res() res: Response,
  ) {
    const { file, bytes } = await this.files.download(r);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(bytes);
  }
}

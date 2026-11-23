import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FILE_STORAGE, S3FileStorage } from './storage';
import { FILE_SCANNER, ClamavScanner } from './clamav-scanner';
@Module({
  controllers: [FilesController],
  providers: [
    FilesService,
    { provide: FILE_STORAGE, useClass: S3FileStorage },
    { provide: FILE_SCANNER, useClass: ClamavScanner },
  ],
  exports: [FilesService],
})
export class FilesModule {}

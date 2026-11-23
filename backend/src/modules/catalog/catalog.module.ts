import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

import { CatalogPolicy } from './catalog.policy';
@Module({
  imports: [],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogPolicy],
  exports: [CatalogService, CatalogPolicy],
})
export class CatalogModule {}

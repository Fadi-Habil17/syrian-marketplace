import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CatalogModule } from '../catalog/catalog.module';
import { StoresModule } from '../stores/stores.module';
import { UsersModule } from '../users/users.service';
import { GeographyModule } from '../geography/geography.module';

@Module({
  imports: [CatalogModule, StoresModule, UsersModule, GeographyModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}

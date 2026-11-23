import { Global, Module } from '@nestjs/common';
import { ContractsService } from './http/contracts.service';
import { CommandsService } from '../common/commands.service';
import { AccessService } from '../common/access.service';
import { RequestLimiter } from '../common/request-limiter';
@Global()
@Module({
  providers: [ContractsService, CommandsService, AccessService, RequestLimiter],
  exports: [ContractsService, CommandsService, AccessService, RequestLimiter],
})
export class CoreModule {}

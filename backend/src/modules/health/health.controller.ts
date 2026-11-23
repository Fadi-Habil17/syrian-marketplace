import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import type { HealthResponse as HealthContract } from '@syrian-marketplace/contracts';
import { Operation, Public } from '../../common/actor';

class HealthResponse implements HealthContract {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ example: 'backend', enum: ['backend'] })
  phase!: 'backend';

  @ApiProperty({ type: Boolean, example: true })
  simulatedPayments!: true;
}

@ApiTags('Infrastructure')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  @Operation('getHealth')
  @ApiOkResponse({ type: HealthResponse, description: 'Process liveness; not database readiness.' })
  getHealth(): HealthResponse {
    return { status: 'ok', phase: 'backend', simulatedPayments: true };
  }
}

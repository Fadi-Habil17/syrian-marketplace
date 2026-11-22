import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import type { HealthResponse as HealthContract } from '@syrian-marketplace/contracts';

class HealthResponse implements HealthContract {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ example: 'setup', enum: ['setup'] })
  phase!: 'setup';

  @ApiProperty({ type: Boolean, example: true })
  simulatedPayments!: true;
}

@ApiTags('Infrastructure')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ type: HealthResponse, description: 'Process liveness; not database readiness.' })
  getHealth(): HealthResponse {
    return { status: 'ok', phase: 'setup', simulatedPayments: true };
  }
}

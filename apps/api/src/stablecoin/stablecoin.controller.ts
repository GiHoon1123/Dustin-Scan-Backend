import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CommonResponseDto } from '../common/dto';
import { StablecoinService } from './stablecoin.service';
import {
  DepositCollateralRequestDto,
  HealthResponseDto,
  LiquidateRequestDto,
  MintStablecoinRequestDto,
  PositionResponseDto,
  RedeemStablecoinRequestDto,
  TransactionResponseDto,
  WithdrawCollateralRequestDto,
} from './dto/stablecoin.dto';

/**
 * Stablecoin Controller
 *
 * 스테이블코인 시스템 관련 HTTP API (프록시)
 * 코어 체인의 API를 프록시하고 응답을 디코딩하여 반환
 */
@ApiTags('스테이블코인 (Stablecoin)')
@ApiExtraModels(
  CommonResponseDto,
  TransactionResponseDto,
  PositionResponseDto,
  HealthResponseDto,
)
@Controller('stablecoin')
export class StablecoinController {
  constructor(private readonly stablecoinService: StablecoinService) {}

  /**
   * 담보 예치
   *
   * POST /stablecoin/deposit
   */
  @Post('deposit')
  @ApiOperation({
    summary: '담보 예치',
    description: 'DSTN을 Vault에 예치합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '담보 예치 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TransactionResponseDto) },
          },
        },
      ],
    },
  })
  async depositCollateral(
    @Body() body: DepositCollateralRequestDto,
  ): Promise<CommonResponseDto<TransactionResponseDto>> {
    const result = await this.stablecoinService.depositCollateral(
      body.privateKey,
      body.amount,
    );
    return CommonResponseDto.success(result, '담보 예치 성공');
  }

  /**
   * 스테이블코인 발행
   *
   * POST /stablecoin/mint
   */
  @Post('mint')
  @ApiOperation({
    summary: '스테이블코인 발행',
    description: '담보를 기반으로 스테이블코인을 발행합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '스테이블코인 발행 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TransactionResponseDto) },
          },
        },
      ],
    },
  })
  async mintStablecoin(
    @Body() body: MintStablecoinRequestDto,
  ): Promise<CommonResponseDto<TransactionResponseDto>> {
    const result = await this.stablecoinService.mintStablecoin(
      body.privateKey,
      body.stablecoinAmount,
    );
    return CommonResponseDto.success(result, '스테이블코인 발행 성공');
  }

  /**
   * 스테이블코인 상환
   *
   * POST /stablecoin/redeem
   */
  @Post('redeem')
  @ApiOperation({
    summary: '스테이블코인 상환',
    description: '발행한 스테이블코인을 상환하여 부채를 감소시킵니다.',
  })
  @ApiResponse({
    status: 201,
    description: '스테이블코인 상환 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TransactionResponseDto) },
          },
        },
      ],
    },
  })
  async redeemStablecoin(
    @Body() body: RedeemStablecoinRequestDto,
  ): Promise<CommonResponseDto<TransactionResponseDto>> {
    const result = await this.stablecoinService.redeemStablecoin(
      body.privateKey,
      body.stablecoinAmount,
    );
    return CommonResponseDto.success(result, '스테이블코인 상환 성공');
  }

  /**
   * 담보 인출
   *
   * POST /stablecoin/withdraw
   */
  @Post('withdraw')
  @ApiOperation({
    summary: '담보 인출',
    description: '담보를 인출합니다. 담보비율이 150% 이상 유지되어야 합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '담보 인출 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TransactionResponseDto) },
          },
        },
      ],
    },
  })
  async withdrawCollateral(
    @Body() body: WithdrawCollateralRequestDto,
  ): Promise<CommonResponseDto<TransactionResponseDto>> {
    const result = await this.stablecoinService.withdrawCollateral(
      body.privateKey,
      body.amount,
    );
    return CommonResponseDto.success(result, '담보 인출 성공');
  }

  /**
   * 청산 실행
   *
   * POST /stablecoin/liquidate
   */
  @Post('liquidate')
  @ApiOperation({
    summary: '청산 실행',
    description: '담보비율이 150% 미만인 포지션을 청산합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '청산 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TransactionResponseDto) },
          },
        },
      ],
    },
  })
  async liquidate(
    @Body() body: LiquidateRequestDto,
  ): Promise<CommonResponseDto<TransactionResponseDto>> {
    const result = await this.stablecoinService.liquidate(
      body.privateKey,
      body.userAddress,
    );
    return CommonResponseDto.success(result, '청산 성공');
  }

  /**
   * 포지션 조회
   *
   * GET /stablecoin/position/:userAddress
   */
  @Get('position/:userAddress')
  @ApiOperation({
    summary: '포지션 조회',
    description: '사용자의 담보 양, 부채 양, 담보비율을 조회합니다. (디코딩된 값)',
  })
  @ApiParam({
    name: 'userAddress',
    description: '사용자 주소',
    example: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
  })
  @ApiResponse({
    status: 200,
    description: '포지션 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(PositionResponseDto) },
          },
        },
      ],
    },
  })
  async getPosition(
    @Param('userAddress') userAddress: string,
  ): Promise<CommonResponseDto<PositionResponseDto>> {
    const result = await this.stablecoinService.getPosition(userAddress);
    return CommonResponseDto.success(result, '포지션 조회 성공');
  }

  /**
   * 건강도 확인
   *
   * GET /stablecoin/health/:userAddress
   */
  @Get('health/:userAddress')
  @ApiOperation({
    summary: '건강도 확인',
    description: '사용자 포지션의 건강도(담보비율 150% 이상)를 확인합니다. (디코딩된 값)',
  })
  @ApiParam({
    name: 'userAddress',
    description: '사용자 주소',
    example: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
  })
  @ApiResponse({
    status: 200,
    description: '건강도 확인 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CommonResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(HealthResponseDto) },
          },
        },
      ],
    },
  })
  async getHealth(
    @Param('userAddress') userAddress: string,
  ): Promise<CommonResponseDto<HealthResponseDto>> {
    const result = await this.stablecoinService.getHealth(userAddress);
    return CommonResponseDto.success(result, '건강도 확인 성공');
  }
}



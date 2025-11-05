import { UpdateContractAbiDto } from '../../../../apps/api/src/contracts/dto/update-contract-abi.dto';

describe('UpdateContractAbiDto', () => {
  it('should be defined', () => {
    expect(UpdateContractAbiDto).toBeDefined();
  });

  it('should create instance with abi', () => {
    const dto = new UpdateContractAbiDto();
    dto.abi = [{ type: 'function', name: 'test' }];
    expect(dto.abi).toBeDefined();
  });

  it('should create instance with all optional fields', () => {
    const dto = new UpdateContractAbiDto();
    dto.abi = [{ type: 'function' }];
    dto.bytecode = '0x6080';
    dto.name = 'TestContract';
    dto.sourceCode = 'contract Test {}';
    dto.compilerVersion = '0.8.20';
    dto.optimization = true;

    expect(dto.abi).toBeDefined();
    expect(dto.bytecode).toBe('0x6080');
    expect(dto.name).toBe('TestContract');
    expect(dto.sourceCode).toBe('contract Test {}');
    expect(dto.compilerVersion).toBe('0.8.20');
    expect(dto.optimization).toBe(true);
  });
});


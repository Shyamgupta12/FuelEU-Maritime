import { ComplianceBalance, AdjustedComplianceBalance } from '../../core/domain/Compliance';
import { ComplianceRepository } from '../../core/ports/ComplianceRepository';

// Mock data
const mockComplianceBalances: Map<number, ComplianceBalance> = new Map([
  [
    2024,
    {
      year: 2024,
      cb: 1500000, // gCO₂e
    },
  ],
]);

const mockAdjustedCBs: Map<number, AdjustedComplianceBalance[]> = new Map([
  [
    2024,
    [
      { shipId: 'ship-001', year: 2024, adjustedCB: 500000 },
      { shipId: 'ship-002', year: 2024, adjustedCB: -300000 },
      { shipId: 'ship-003', year: 2024, adjustedCB: 800000 },
      { shipId: 'ship-004', year: 2024, adjustedCB: -200000 },
    ],
  ],
]);

export class MockComplianceRepository implements ComplianceRepository {
  async findComplianceBalance(year: number): Promise<ComplianceBalance> {
    const cb = mockComplianceBalances.get(year);
    if (!cb) {
      return { year, cb: 0 };
    }
    return { ...cb };
  }

  async findAdjustedComplianceBalance(year: number): Promise<AdjustedComplianceBalance[]> {
    return mockAdjustedCBs.get(year) || [];
  }
}


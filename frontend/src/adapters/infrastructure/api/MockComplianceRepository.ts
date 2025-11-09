import { IComplianceRepository } from '../../../core/ports/repositories/IComplianceRepository';
import { ComplianceBalance, AdjustedComplianceBalance, BankingOperation } from '../../../core/domain/models/Compliance';

export class MockComplianceRepository implements IComplianceRepository {
  private complianceBalances: Map<number, number> = new Map([
    [2023, 150.5],
    [2024, -75.2],
  ]);

  private bankedSurplus: Map<number, number> = new Map([
    [2023, 50.0],
  ]);

  async getComplianceBalance(year: number): Promise<ComplianceBalance> {
    const balance = this.complianceBalances.get(year) || 0;
    return {
      year,
      complianceBalance: balance,
      status: balance > 0 ? 'surplus' : balance < 0 ? 'deficit' : 'neutral',
    };
  }

  async getAdjustedComplianceBalance(year: number): Promise<AdjustedComplianceBalance[]> {
    return [
      {
        shipId: 'S001',
        shipName: 'MV Ocean Pioneer',
        adjustedCB: 45.3,
        year,
      },
      {
        shipId: 'S002',
        shipName: 'MV Sea Navigator',
        adjustedCB: -20.1,
        year,
      },
      {
        shipId: 'S003',
        shipName: 'MV Atlantic Trader',
        adjustedCB: 30.8,
        year,
      },
      {
        shipId: 'S004',
        shipName: 'MV Pacific Spirit',
        adjustedCB: -15.5,
        year,
      },
    ];
  }

  async bankSurplus(amount: number, year: number): Promise<BankingOperation> {
    const cb_before = this.complianceBalances.get(year) || 0;
    const cb_after = cb_before - amount;
    
    this.complianceBalances.set(year, cb_after);
    const banked = this.bankedSurplus.get(year) || 0;
    this.bankedSurplus.set(year, banked + amount);

    return {
      operationType: 'bank',
      amount,
      year,
      cb_before,
      cb_after,
    };
  }

  async applyBanked(amount: number, year: number): Promise<BankingOperation> {
    const cb_before = this.complianceBalances.get(year) || 0;
    const cb_after = cb_before + amount;
    
    this.complianceBalances.set(year, cb_after);
    const banked = this.bankedSurplus.get(year) || 0;
    this.bankedSurplus.set(year, Math.max(0, banked - amount));

    return {
      operationType: 'apply',
      amount,
      year,
      cb_before,
      cb_after,
    };
  }
}

import { ComplianceBalance } from '../../core/domain/Compliance';
import { BankingRepository } from '../../core/ports/BankingRepository';

const complianceBalances: Map<number, ComplianceBalance> = new Map([
  [2024, { year: 2024, cb: 1500000 }],
]);

const bankedAmounts: Map<number, number> = new Map();

export class MockBankingRepository implements BankingRepository {
  async getComplianceBalance(year: number): Promise<ComplianceBalance> {
    const cb = complianceBalances.get(year);
    if (!cb) {
      return { year, cb: 0 };
    }
    return { ...cb };
  }

  async bankSurplus(year: number, amount: number): Promise<void> {
    const currentCB = await this.getComplianceBalance(year);
    const newCB = currentCB.cb - amount;
    complianceBalances.set(year, { year, cb: newCB });
    
    const existingBanked = bankedAmounts.get(year) || 0;
    bankedAmounts.set(year, existingBanked + amount);
  }

  async getBankedAmount(year: number): Promise<number> {
    return bankedAmounts.get(year) || 0;
  }

  async applyBankedSurplus(year: number, amount: number): Promise<void> {
    const currentBanked = await this.getBankedAmount(year);
    const appliedAmount = Math.min(amount, currentBanked);
    
    bankedAmounts.set(year, currentBanked - appliedAmount);
    
    const currentCB = await this.getComplianceBalance(year);
    complianceBalances.set(year, { year, cb: currentCB.cb + appliedAmount });
  }
}


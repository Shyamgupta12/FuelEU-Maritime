import { ComplianceBalance } from '../../core/domain/Compliance';
import { BankingRepository } from '../../core/ports/BankingRepository';

/**
 * Mock implementation for development/testing
 */
export class MockBankingRepository implements BankingRepository {
  private complianceBalances: Map<number, number> = new Map();
  private bankedEntries: Map<string, number> = new Map(); // key: "shipId:year", value: amount

  async getComplianceBalance(year: number): Promise<ComplianceBalance> {
    return {
      year,
      cb: this.complianceBalances.get(year) || 0,
    };
  }

  async bankSurplusForShip(shipId: string, year: number, amount: number): Promise<void> {
    const key = `${shipId}:${year}`;
    const current = this.bankedEntries.get(key) || 0;
    this.bankedEntries.set(key, current + amount);
  }

  async getBankedAmountForShip(shipId: string, year: number): Promise<number> {
    const key = `${shipId}:${year}`;
    return this.bankedEntries.get(key) || 0;
  }

  async applyBankedSurplusToShip(shipId: string, year: number, amount: number): Promise<void> {
    const key = `${shipId}:${year}`;
    const current = this.bankedEntries.get(key) || 0;
    
    if (current < amount) {
      throw new Error(`Insufficient banked surplus. Available: ${current}, Requested: ${amount}`);
    }
    
    this.bankedEntries.set(key, current - amount);
  }

  // Legacy methods (deprecated)
  async bankSurplus(year: number, amount: number): Promise<void> {
    const current = this.complianceBalances.get(year) || 0;
    this.complianceBalances.set(year, current - amount);
  }

  async getBankedAmount(year: number): Promise<number> {
    // Sum all banked amounts for the year
    let total = 0;
    for (const [key, amount] of this.bankedEntries.entries()) {
      if (key.endsWith(`:${year}`)) {
        total += amount;
      }
    }
    return total;
  }

  async applyBankedSurplus(year: number, amount: number): Promise<void> {
    // This is a simplified implementation for legacy support
    const current = this.complianceBalances.get(year) || 0;
    this.complianceBalances.set(year, current + amount);
  }
}

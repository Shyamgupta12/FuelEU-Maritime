import { ComplianceBalance } from '../domain/Compliance';

export interface BankingRepository {
  getComplianceBalance(year: number): Promise<ComplianceBalance>;
  bankSurplus(year: number, amount: number): Promise<void>;
  getBankedAmount(year: number): Promise<number>;
  applyBankedSurplus(year: number, amount: number): Promise<void>;
}


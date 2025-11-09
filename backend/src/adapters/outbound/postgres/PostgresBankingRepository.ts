import { ComplianceBalance } from '../../core/domain/Compliance';
import { BankingRepository } from '../../core/ports/BankingRepository';
import pool from './database/connection';

export class PostgresBankingRepository implements BankingRepository {
  async getComplianceBalance(year: number): Promise<ComplianceBalance> {
    try {
      const result = await pool.query(
        `SELECT year, cb FROM compliance_balances WHERE year = $1`,
        [year]
      );
      
      if (result.rows.length === 0) {
        // Initialize if not exists
        await pool.query(
          `INSERT INTO compliance_balances (year, cb) VALUES ($1, 0) ON CONFLICT (year) DO NOTHING`,
          [year]
        );
        return { year, cb: 0 };
      }
      
      return {
        year: result.rows[0].year,
        cb: parseFloat(result.rows[0].cb),
      };
    } catch (error) {
      console.error('Error fetching compliance balance:', error);
      return { year, cb: 0 };
    }
  }

  async bankSurplus(year: number, amount: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current CB
      const cbResult = await client.query(
        `SELECT cb FROM compliance_balances WHERE year = $1 FOR UPDATE`,
        [year]
      );

      if (cbResult.rows.length === 0) {
        await client.query(
          `INSERT INTO compliance_balances (year, cb) VALUES ($1, 0)`,
          [year]
        );
      }

      // Deduct from CB
      await client.query(
        `UPDATE compliance_balances 
         SET cb = cb - $1, updated_at = CURRENT_TIMESTAMP 
         WHERE year = $2`,
        [amount, year]
      );

      // Add to banked amount
      await client.query(
        `INSERT INTO banking (year, banked_amount) 
         VALUES ($1, $2)
         ON CONFLICT (year) 
         DO UPDATE SET banked_amount = banking.banked_amount + $2`,
        [year, amount]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error banking surplus:', error);
      throw new Error('Failed to bank surplus');
    } finally {
      client.release();
    }
  }

  async getBankedAmount(year: number): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT COALESCE(banked_amount, 0) as banked_amount 
         FROM banking 
         WHERE year = $1`,
        [year]
      );
      
      if (result.rows.length === 0) {
        return 0;
      }
      
      return parseFloat(result.rows[0].banked_amount);
    } catch (error) {
      console.error('Error fetching banked amount:', error);
      return 0;
    }
  }

  async applyBankedSurplus(year: number, amount: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current banked amount
      const bankedResult = await client.query(
        `SELECT banked_amount FROM banking WHERE year = $1 FOR UPDATE`,
        [year]
      );

      if (bankedResult.rows.length === 0 || parseFloat(bankedResult.rows[0].banked_amount) < amount) {
        throw new Error('Insufficient banked surplus');
      }

      // Deduct from banked amount
      await client.query(
        `UPDATE banking 
         SET banked_amount = banked_amount - $1 
         WHERE year = $2`,
        [amount, year]
      );

      // Add to CB
      await client.query(
        `INSERT INTO compliance_balances (year, cb) 
         VALUES ($1, $2)
         ON CONFLICT (year) 
         DO UPDATE SET cb = compliance_balances.cb + $2, updated_at = CURRENT_TIMESTAMP`,
        [year, amount]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error applying banked surplus:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "../components/StatCard";
import { ComplianceBalance, BankingOperation } from "@/core/domain/models/Compliance";
import { ComplianceUseCases } from "@/core/application/usecases/ComplianceUseCases";
import { HttpComplianceRepository } from "@/adapters/infrastructure/api/HttpComplianceRepository";
import { formatNumber } from "@/shared/utils/formatting";
import { toast } from "@/shared/hooks/use-toast";
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const complianceUseCases = new ComplianceUseCases(new HttpComplianceRepository());

export function BankingPage() {
  const [year, setYear] = useState<number>(2023);
  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [lastOperation, setLastOperation] = useState<BankingOperation | null>(null);

  useEffect(() => {
    loadComplianceBalance();
  }, [year]);

  const loadComplianceBalance = async () => {
    const data = await complianceUseCases.getComplianceBalance(year);
    setCb(data);
  };

  const handleBank = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const operation = await complianceUseCases.bankSurplus(parseFloat(amount), year);
      setLastOperation(operation);
      await loadComplianceBalance();
      setAmount("");
      toast({
        title: "Surplus Banked",
        description: `Successfully banked ${formatNumber(parseFloat(amount))} units`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to bank surplus",
        variant: "destructive",
      });
    }
  };

  const handleApply = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const operation = await complianceUseCases.applyBankedSurplus(parseFloat(amount), year);
      setLastOperation(operation);
      await loadComplianceBalance();
      setAmount("");
      toast({
        title: "Banked Surplus Applied",
        description: `Successfully applied ${formatNumber(parseFloat(amount))} units`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply banked surplus",
        variant: "destructive",
      });
    }
  };

  const canBank = cb && complianceUseCases.canBankSurplus(cb.complianceBalance);
  const canApply = cb && cb.complianceBalance < 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Banking & Borrowing</h2>
        <p className="text-muted-foreground mt-2">
          Manage compliance balance through banking surplus or applying banked credits
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Label>Year:</Label>
        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Current Balance"
          value={cb ? formatNumber(cb.complianceBalance) : "Loading..."}
          description={cb?.status}
          icon={Wallet}
          className={
            cb?.status === 'surplus' ? 'border-success' :
            cb?.status === 'deficit' ? 'border-destructive' : ''
          }
        />
        <StatCard
          title="Can Bank"
          value={canBank ? "Yes" : "No"}
          description="Surplus available for banking"
          icon={TrendingUp}
        />
        <StatCard
          title="Can Apply"
          value={canApply ? "Yes" : "No"}
          description="Deficit can use banked surplus"
          icon={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Bank Surplus
            </CardTitle>
            <CardDescription>
              Save positive compliance balance for future use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-amount">Amount to Bank</Label>
              <Input
                id="bank-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canBank}
              />
            </div>
            <Button
              onClick={handleBank}
              disabled={!canBank || !amount}
              className="w-full"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Bank Surplus
            </Button>
            {!canBank && (
              <p className="text-sm text-muted-foreground">
                Banking requires a positive compliance balance
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Apply Banked
            </CardTitle>
            <CardDescription>
              Use banked surplus to cover deficit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apply-amount">Amount to Apply</Label>
              <Input
                id="apply-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canApply}
              />
            </div>
            <Button
              onClick={handleApply}
              disabled={!canApply || !amount}
              className="w-full"
              variant="secondary"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Apply Banked Surplus
            </Button>
            {!canApply && (
              <p className="text-sm text-muted-foreground">
                Applying requires a deficit and available banked surplus
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {lastOperation && (
        <Card>
          <CardHeader>
            <CardTitle>Last Operation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{lastOperation.operationType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">{formatNumber(lastOperation.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CB Before</p>
                <p className="font-medium">{formatNumber(lastOperation.cb_before)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CB After</p>
                <p className="font-medium">{formatNumber(lastOperation.cb_after)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "../components/DataTable";
import { StatCard } from "../components/StatCard";
import { AdjustedComplianceBalance } from "@/core/domain/models/Compliance";
import { ComplianceUseCases } from "@/core/application/usecases/ComplianceUseCases";
import { PoolUseCases } from "@/core/application/usecases/PoolUseCases";
import { HttpComplianceRepository } from "@/adapters/infrastructure/api/HttpComplianceRepository";
import { HttpPoolRepository } from "@/adapters/infrastructure/api/HttpPoolRepository";
import { formatNumber } from "@/shared/utils/formatting";
import { toast } from "@/shared/hooks/use-toast";
import { Users, CheckCircle2, XCircle } from "lucide-react";

const complianceUseCases = new ComplianceUseCases(new HttpComplianceRepository());
const poolUseCases = new PoolUseCases(new HttpPoolRepository());

export function PoolingPage() {
  const [year, setYear] = useState<number>(2023);
  const [ships, setShips] = useState<AdjustedComplianceBalance[]>([]);
  const [selectedShips, setSelectedShips] = useState<Set<string>>(new Set());
  const [poolName, setPoolName] = useState<string>("");

  useEffect(() => {
    loadShips();
  }, [year]);

  const loadShips = async () => {
    const data = await complianceUseCases.getAdjustedComplianceBalances(year);
    setShips(data);
  };

  const handleToggleShip = (shipId: string) => {
    const newSelected = new Set(selectedShips);
    if (newSelected.has(shipId)) {
      newSelected.delete(shipId);
    } else {
      newSelected.add(shipId);
    }
    setSelectedShips(newSelected);
  };

  const selectedMembers = ships.filter(s => selectedShips.has(s.shipId));
  const totalCB = poolUseCases.calculatePoolTotal(selectedMembers);
  const canCreate = poolUseCases.canCreatePool(selectedMembers) && poolName.trim() !== "" && selectedMembers.length >= 2;

  const handleCreatePool = async () => {
    if (!canCreate) {
      toast({
        title: "Cannot Create Pool",
        description: "Pool requires at least 2 ships with non-negative total CB",
        variant: "destructive",
      });
      return;
    }

    try {
      const pool = await poolUseCases.createPool({
        name: poolName,
        year,
        shipIds: Array.from(selectedShips),
      });
      
      toast({
        title: "Pool Created",
        description: `Pool "${pool.name}" created successfully with ${pool.members.length} members`,
      });
      
      setSelectedShips(new Set());
      setPoolName("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create pool",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      header: "Select",
      accessor: (row: AdjustedComplianceBalance) => (
        <Checkbox
          checked={selectedShips.has(row.shipId)}
          onCheckedChange={() => handleToggleShip(row.shipId)}
        />
      ),
    },
    { header: "Ship ID", accessor: "shipId" as keyof AdjustedComplianceBalance },
    { header: "Ship Name", accessor: "shipName" as keyof AdjustedComplianceBalance },
    {
      header: "Adjusted CB",
      accessor: (row: AdjustedComplianceBalance) => (
        <span className={`font-mono ${row.adjustedCB >= 0 ? 'text-success' : 'text-destructive'}`}>
          {formatNumber(row.adjustedCB)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row: AdjustedComplianceBalance) => (
        <div className="flex items-center gap-2">
          {row.adjustedCB >= 0 ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-success">Surplus</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive">Deficit</span>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Compliance Pooling</h2>
        <p className="text-muted-foreground mt-2">
          Create pools to share compliance balance among multiple vessels
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Selected Ships"
          value={selectedShips.size}
          description="Minimum 2 required"
          icon={Users}
        />
        <StatCard
          title="Total CB"
          value={formatNumber(totalCB)}
          description={totalCB >= 0 ? "Valid pool" : "Invalid pool"}
          className={totalCB >= 0 ? 'border-success' : 'border-destructive'}
        />
        <StatCard
          title="Surplus Ships"
          value={selectedMembers.filter(s => s.adjustedCB >= 0).length}
          icon={CheckCircle2}
        />
        <StatCard
          title="Deficit Ships"
          value={selectedMembers.filter(s => s.adjustedCB < 0).length}
          icon={XCircle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Pool</CardTitle>
          <CardDescription>
            Select ships to form a compliance pool. Total adjusted CB must be non-negative.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pool-name">Pool Name</Label>
            <Input
              id="pool-name"
              placeholder="e.g., North Atlantic Fleet Pool"
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
            />
          </div>

          <DataTable data={ships} columns={columns} />

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              {canCreate ? (
                <span className="text-success flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Pool is valid and ready to create
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {selectedMembers.length < 2 
                    ? "Select at least 2 ships" 
                    : totalCB < 0 
                    ? "Total CB must be non-negative" 
                    : "Enter pool name"}
                </span>
              )}
            </div>
            <Button onClick={handleCreatePool} disabled={!canCreate}>
              <Users className="h-4 w-4 mr-2" />
              Create Pool
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

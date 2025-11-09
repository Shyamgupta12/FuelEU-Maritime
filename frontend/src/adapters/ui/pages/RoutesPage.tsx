import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ComplianceStatusBadge } from "../components/ComplianceStatusBadge";
import { Route } from "@/core/domain/models/Route";
import { RouteUseCases } from "@/core/application/usecases/RouteUseCases";
import { HttpRouteRepository } from "@/adapters/infrastructure/api/HttpRouteRepository";
import { formatIntensity, formatFuel, formatDistance, formatEmissions } from "@/shared/utils/formatting";
import { toast } from "@/shared/hooks/use-toast";
import { Ship, TrendingUp } from "lucide-react";

const routeUseCases = new RouteUseCases(new HttpRouteRepository());

export function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [routes, filters]);

  const loadRoutes = async () => {
    const data = await routeUseCases.getAllRoutes();
    setRoutes(data);
  };

  const applyFilters = async () => {
    const filtered = await routeUseCases.filterRoutes(filters);
    setFilteredRoutes(filtered);
  };

  const handleSetBaseline = async (routeId: string) => {
    try {
      await routeUseCases.setRouteAsBaseline(routeId);
      await loadRoutes();
      toast({
        title: "Baseline Set",
        description: `Route ${routeId} has been set as baseline.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set baseline",
        variant: "destructive",
      });
    }
  };

  const vesselTypes = [...new Set(routes.map(r => r.vesselType))];
  const fuelTypes = [...new Set(routes.map(r => r.fuelType))];
  const years = [...new Set(routes.map(r => r.year))];

  const columns = [
    {
      header: "Route ID",
      accessor: (row: Route) => (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-primary" />
          <span className="font-medium">{row.routeId}</span>
        </div>
      ),
    },
    { header: "Vessel Type", accessor: "vesselType" as keyof Route },
    { header: "Fuel Type", accessor: "fuelType" as keyof Route },
    { header: "Year", accessor: "year" as keyof Route },
    {
      header: "GHG Intensity",
      accessor: (row: Route) => {
        const intensity = typeof row.ghgIntensity === 'number' ? row.ghgIntensity : parseFloat(String(row.ghgIntensity || 0));
        return (
          <div className="flex items-center gap-2">
            {formatIntensity(row.ghgIntensity)}
            {!isNaN(intensity) && intensity > 89.3368 && <TrendingUp className="h-4 w-4 text-destructive" />}
          </div>
        );
      },
    },
    { header: "Fuel Consumption", accessor: (row: Route) => formatFuel(row.fuelConsumption) },
    { header: "Distance", accessor: (row: Route) => formatDistance(row.distance) },
    { header: "Total Emissions", accessor: (row: Route) => formatEmissions(row.totalEmissions) },
    {
      header: "Status",
      accessor: (row: Route) => {
        const intensity = typeof row.ghgIntensity === 'number' ? row.ghgIntensity : parseFloat(String(row.ghgIntensity || 0));
        const isCompliant = !isNaN(intensity) && intensity <= 89.3368;
        return (
          <div className="flex items-center gap-2">
            {row.isBaseline && <ComplianceStatusBadge status="surplus" className="text-xs" />}
            <ComplianceStatusBadge 
              status={isCompliant ? 'compliant' : 'non-compliant'}
              className="text-xs"
            />
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessor: (row: Route) => (
        <Button
          size="sm"
          variant={row.isBaseline ? "secondary" : "default"}
          onClick={() => handleSetBaseline(row.routeId)}
          disabled={row.isBaseline}
        >
          {row.isBaseline ? "Baseline" : "Set Baseline"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Routes Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage vessel routes and set baseline emissions for compliance tracking
        </p>
      </div>

      <FilterBar
        filters={[
          {
            label: "Vessel Type",
            value: filters.vesselType,
            options: vesselTypes.map(v => ({ label: v, value: v })),
            onChange: (value) => setFilters({ ...filters, vesselType: value }),
          },
          {
            label: "Fuel Type",
            value: filters.fuelType,
            options: fuelTypes.map(f => ({ label: f, value: f })),
            onChange: (value) => setFilters({ ...filters, fuelType: value }),
          },
          {
            label: "Year",
            value: filters.year?.toString(),
            options: years.map(y => ({ label: y.toString(), value: y.toString() })),
            onChange: (value) => setFilters({ ...filters, year: value ? parseInt(value) : undefined }),
          },
        ]}
        onReset={() => setFilters({})}
      />

      <DataTable data={filteredRoutes} columns={columns} />
    </div>
  );
}

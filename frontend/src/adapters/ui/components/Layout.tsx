import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ship, BarChart3, Wallet, Users, FileCheck } from "lucide-react";

interface LayoutProps {
  children?: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Ship className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Fuel EU Maritime</h1>
              <p className="text-sm text-muted-foreground">Compliance Management System</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
            <TabsTrigger value="routes" className="gap-2">
              <Ship className="h-4 w-4" />
              <span className="hidden sm:inline">Routes</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger value="ship-compliance" className="gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Ship CB</span>
            </TabsTrigger>
            <TabsTrigger value="banking" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Banking</span>
            </TabsTrigger>
            <TabsTrigger value="pooling" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Pooling</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {children}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-12 bg-card/30">
        <div className="container mx-auto px-6 py-6">
          <p className="text-sm text-muted-foreground text-center">
            Fuel EU Maritime Compliance Module - Hexagonal Architecture Implementation
          </p>
        </div>
      </footer>
    </div>
  );
}

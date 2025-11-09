import { useState } from "react";
import { Layout } from "@/adapters/ui/components/Layout";
import { RoutesPage } from "@/adapters/ui/pages/RoutesPage";
import { ComparePage } from "@/adapters/ui/pages/ComparePage";
import { BankingPage } from "@/adapters/ui/pages/BankingPage";
import { PoolingPage } from "@/adapters/ui/pages/PoolingPage";

const Index = () => {
  const [activeTab, setActiveTab] = useState("routes");

  const renderPage = () => {
    switch (activeTab) {
      case "routes":
        return <RoutesPage />;
      case "compare":
        return <ComparePage />;
      case "banking":
        return <BankingPage />;
      case "pooling":
        return <PoolingPage />;
      default:
        return <RoutesPage />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderPage()}
    </Layout>
  );
};

export default Index;

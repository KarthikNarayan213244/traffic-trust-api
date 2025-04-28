
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import TrustLedgerTable from "@/components/dashboard/TrustLedgerTable";

const TrustLedger: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Trust Ledger</h1>
        <TrustLedgerTable dataEndpoint="trustLedger" />
      </div>
    </MainLayout>
  );
};

export default TrustLedger;

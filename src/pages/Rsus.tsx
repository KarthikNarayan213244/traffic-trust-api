
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import DataTable from "@/components/dashboard/DataTable";

const Rsus: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Roadside Units</h1>
        <DataTable 
          columns={["rsu_id", "location", "status", "coverage_radius"]}
          dataEndpoint="rsus" 
          title="Deployed RSUs"
        />
      </div>
    </MainLayout>
  );
};

export default Rsus;

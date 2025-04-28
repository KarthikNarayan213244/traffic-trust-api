
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import DataTable from "@/components/dashboard/DataTable";

const Vehicles: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <DataTable 
          columns={["vehicle_id", "owner_name", "vehicle_type", "trust_score"]}
          dataEndpoint="vehicles" 
          title="Registered Vehicles"
        />
      </div>
    </MainLayout>
  );
};

export default Vehicles;

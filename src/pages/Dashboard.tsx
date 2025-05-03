
import React from "react";
import { seedDatabaseWithTestData } from "@/services/api/supabase";
import DashboardContainer from "@/components/dashboard/DashboardContainer";

const Dashboard: React.FC = () => {
  return <DashboardContainer />;
};

export default Dashboard;

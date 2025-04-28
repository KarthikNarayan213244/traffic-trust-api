
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ApiSettings from '@/components/settings/ApiSettings';
import EnvConfig from '@/components/settings/EnvConfig';
import { DataSeeder } from '@/components/dashboard/DataSeeder';

export default function Settings() {
  return (
    <MainLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <Separator className="my-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ApiSettings />
          <EnvConfig />
          
          {/* Add the data seeder component */}
          <DataSeeder />
        </div>
      </div>
    </MainLayout>
  );
}


import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingSkeletonProps {
  type?: "card" | "chart" | "table" | "map";
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = "card",
  count = 1
}) => {
  const renderCardSkeleton = () => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <Skeleton className="h-6 w-[120px]" />
        <Skeleton className="h-4 w-[180px] mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[40px] w-full" />
      </CardContent>
    </Card>
  );

  const renderChartSkeleton = () => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <Skeleton className="h-6 w-[140px]" />
        <Skeleton className="h-4 w-[200px] mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full rounded-md" />
      </CardContent>
    </Card>
  );

  const renderTableSkeleton = () => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <Skeleton className="h-6 w-[140px]" />
        <Skeleton className="h-4 w-[200px] mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-full mb-4" />
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-12 w-full my-2" />
          ))}
      </CardContent>
    </Card>
  );

  const renderMapSkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="h-[400px] w-full" />
    </Card>
  );

  const renderSkeleton = () => {
    switch (type) {
      case "chart":
        return renderChartSkeleton();
      case "table":
        return renderTableSkeleton();
      case "map":
        return renderMapSkeleton();
      case "card":
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="animate-pulse">
            {renderSkeleton()}
          </div>
        ))}
    </>
  );
};

export default LoadingSkeleton;

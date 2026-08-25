import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-48" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

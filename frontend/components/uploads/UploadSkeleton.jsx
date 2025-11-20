import { Skeleton } from "@/components/ui/skeleton";

export function UploadSkeleton() {
    return (
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
            <Skeleton className="aspect-square w-full bg-gray-800/50" />
            <div className="p-4 space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="h-6 w-20 rounded-lg bg-gray-800/50" />
                </div>
                <Skeleton className="h-4 w-24 bg-gray-800/50" />
                <div className="pt-2 border-t border-gray-800/50 space-y-2">
                    <Skeleton className="h-3 w-full bg-gray-800/50" />
                    <Skeleton className="h-3 w-2/3 bg-gray-800/50" />
                </div>
            </div>
        </div>
    );
}

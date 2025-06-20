export default function ExhibitionCardSkeleton() {
  return (
    <div className="card-minimal overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-[4/3] bg-gray-200" />
      
      {/* Content skeleton */}
      <div className="p-6 space-y-3">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        
        {/* Location skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        
        {/* Date skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
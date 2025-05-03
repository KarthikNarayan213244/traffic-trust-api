
import React from "react";

const MapInfoOverlay: React.FC = () => {
  return (
    <div className="absolute bottom-2 left-2 bg-white/90 rounded-md p-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="flex items-center">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
          High Trust (85+)
        </span>
        <span className="flex items-center">
          <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-1"></span>
          Medium Trust (70-84)
        </span>
        <span className="flex items-center">
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
          Low Trust (&lt;70)
        </span>
      </div>
    </div>
  );
};

export default MapInfoOverlay;


import React from "react";

const MapInfoOverlay: React.FC = () => {
  return (
    <div className="absolute bottom-2 left-2 bg-white/90 rounded-md p-3 text-xs shadow-md border border-gray-100 z-10">
      <h4 className="font-semibold mb-1">Trust Score Legend</h4>
      <div className="grid grid-cols-1 gap-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
          <span>High Trust (85+) - Most reliable vehicles</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
          <span>Medium Trust (70-84) - Regular vehicles</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
          <span>Low Trust (&lt;70) - Potentially unreliable</span>
        </div>
        <div className="flex items-center gap-2 pt-1 mt-1 border-t border-gray-200">
          <span className="inline-block w-3 h-3 border-2 border-green-500 bg-transparent rounded-full"></span>
          <span>RSU Coverage - Roadside monitoring units</span>
        </div>
      </div>
    </div>
  );
};

export default MapInfoOverlay;

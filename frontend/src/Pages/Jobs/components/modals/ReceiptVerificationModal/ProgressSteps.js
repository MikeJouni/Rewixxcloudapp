import React from "react";

const ProgressSteps = ({ currentStep }) => {
  return (
    <div className="flex mb-6 gap-2">
      <div
        className={`px-3 py-1 rounded-full text-xs ${
          currentStep >= 1
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        1. Items
      </div>
      <div
        className={`px-3 py-1 rounded-full text-xs ${
          currentStep >= 2
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        2. Missing
      </div>
      <div
        className={`px-3 py-1 rounded-full text-xs ${
          currentStep >= 3
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        3. Confirm
      </div>
    </div>
  );
};

export default ProgressSteps;

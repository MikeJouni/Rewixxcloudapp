import React from "react";
import { useNavigate } from "react-router-dom";
import JobForm from "./forms/JobForm";
import useJobs from "../hooks/useJobs";

const JobsCreateView = () => {
  const navigate = useNavigate();
  const { addJob } = useJobs();

  const handleCreateSuccess = (response) => {
    // Navigate back to the jobs list
    navigate("/jobs");
  };

  const handleCancel = () => {
    navigate("/jobs");
  };

  return (
    <div className="p-4 sm:p-6 w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Create New Job
        </h1>
        <button
          className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm sm:text-base"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>

      <JobForm
        onSubmit={(jobData) => {
          addJob.mutate(jobData, {
            onSuccess: handleCreateSuccess,
          });
        }}
        onCancel={handleCancel}
        initialData={null}
      />
    </div>
  );
};

export default JobsCreateView;

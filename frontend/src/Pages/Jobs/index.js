import React, { useState } from "react";
import JobForm from "./components/forms/JobForm";
import JobTable from "./components/tables/JobTable";
import ReceiptVerificationModal from "./components/modals/ReceiptVerificationModal";
import JobDetailModal from "./components/modals/JobDetailModal";
import useJobs from "./hooks/useJobs";

const JobsPage = () => {
  const {
    filteredJobs,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    statusOptions,
    editingJob,
    isMobile,
    processingReceipt,
    selectedJobForReceipt,
    showReceiptModal,
    setShowReceiptModal,
    showVerificationModal,
    setShowVerificationModal,
    currentReceiptData,
    selectedJobForDetails,
    showJobDetailModal,
    setShowJobDetailModal,
    addJob,
    updateJob,
    deleteJob,
    startEditing,
    cancelEditing,
    handleReceiptUpload,
    handleReceiptVerification,
    viewReceipts,
    viewJobDetails,
    handleJobUpdate,
  } = useJobs();

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Job Management</h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add New Job"}
        </button>
      </div>

      {/* Add/Edit Job Form */}
      {(showAddForm || editingJob) && (
        <JobForm
          onSubmit={(jobData) => {
            if (editingJob) {
              updateJob({ ...jobData, id: editingJob.id });
            } else {
              addJob(jobData);
              setShowAddForm(false);
            }
          }}
          onCancel={() => {
            setShowAddForm(false);
            cancelEditing();
          }}
          initialData={editingJob}
        />
      )}

      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <JobTable
        jobs={filteredJobs}
        onViewDetails={viewJobDetails}
        onEdit={startEditing}
        onDelete={deleteJob}
        onReceiptUpload={handleReceiptUpload}
        processingReceipt={processingReceipt}
        isMobile={isMobile}
      />

      {/* Modals */}
      <ReceiptVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        receiptData={currentReceiptData}
        onVerify={handleReceiptVerification}
      />

      {showJobDetailModal && selectedJobForDetails && (
        <JobDetailModal
          job={selectedJobForDetails}
          isOpen={showJobDetailModal}
          onUpdate={handleJobUpdate}
          onClose={() => setShowJobDetailModal(false)}
        />
      )}
    </div>
  );
};

export default JobsPage;

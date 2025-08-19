import React from "react";
import { useNavigate } from "react-router-dom";
import MaterialForm from "./forms/MaterialForm";
import JobTable from "./tables/JobTable";
import ReceiptVerificationModal from "./modals/ReceiptVerificationModal";
import JobDetailModal from "./modals/JobDetailModal";
import useJobs from "../hooks/useJobs";

const JobsListView = () => {
  const navigate = useNavigate();
  const {
    filteredJobs,
    isLoading,
    isMobile,
    processingReceiptJobId,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    statusOptions,
    editingJob,
    showVerificationModal,
    setShowVerificationModal,
    currentReceiptData,
    selectedJobForDetails,
    showJobDetailModal,
    setShowJobDetailModal,
    deleteJob,
    updateJob,
    startEditing,
    cancelEditing,
    handleReceiptUpload,
    handleReceiptVerification,
    removeReceipt,
    clearAllReceipts,
    viewJobDetails,
    handleJobUpdate,
    openMaterialForm,
    closeMaterialForm,
    handleAddMaterial,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    hasNext,
    hasPrevious,
    showMaterialForm,
    selectedJobForMaterial,
    products,
  } = useJobs();

  return (
    <div className="p-4 sm:p-6 w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Job Management
        </h1>
        <button
          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
          onClick={() => navigate("/jobs/create")}
        >
          Add New Job
        </button>
      </div>

      {/* Add Material Form */}
      {showMaterialForm && selectedJobForMaterial && (
        <MaterialForm
          onSubmit={handleAddMaterial}
          onCancel={closeMaterialForm}
          products={products}
          isMobile={isMobile}
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
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading jobs...</p>
        </div>
      ) : (
        <JobTable
          jobs={filteredJobs}
          onViewDetails={viewJobDetails}
          onEdit={updateJob.mutateAsync}
          onDelete={(id) => deleteJob.mutate(id)}
          onAddMaterial={openMaterialForm}
          onReceiptUpload={handleReceiptUpload}
          processingReceiptJobId={processingReceiptJobId}
          isMobile={isMobile}
        />
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={!hasPrevious}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasNext}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm">
            Rows per page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => {
              setPage(0);
              setPageSize(Number(e.target.value));
            }}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

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
          onUpdateJob={handleJobUpdate}
          onClose={() => setShowJobDetailModal(false)}
          onRemoveReceipt={removeReceipt}
          onClearAllReceipts={clearAllReceipts}
        />
      )}
    </div>
  );
};

export default JobsListView;

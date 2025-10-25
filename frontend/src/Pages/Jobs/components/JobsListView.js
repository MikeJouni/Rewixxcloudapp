import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Spin } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import JobTable from "./tables/JobTable";
import JobDetailModal from "./modals/JobDetailModal";
import ReceiptTableModal from "./modals/ReceiptTableModal";
import useJobs from "../hooks/useJobs";

const JobsListView = () => {
  const navigate = useNavigate();
  const {
    filteredJobs,
    isLoading,
    processingReceiptJobId,
    searchTerm,
    setSearchTerm,
    selectedJobForDetails,
    setSelectedJobForDetails,
    showJobDetailModal,
    setShowJobDetailModal,
    deleteJob,
    updateJob,
    handleReceiptUpload,
    viewJobDetails,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    hasNext,
    hasPrevious,
    products,
    productsLoading,
    productsError,
    addMaterialToJob,
    // Receipt-related functions
    setProcessingReceiptJobId,
    showVerificationModal,
    setShowVerificationModal,
    currentReceiptData,
    handleReceiptVerification,
    removeReceipt,
    clearAllReceipts,
    // Material removal function
    removeMaterialFromJob,
  } = useJobs();


  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Job Management
        </h1>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate("/jobs/create")}
          className="w-full sm:w-auto"
          style={{ 
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', 
            border: 'none',
          }}
        >
          Add New Job
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <Input
          size="large"
          placeholder="Search jobs by title or customer name..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ borderRadius: '8px' }}
        />
      </div>

      {/* Jobs Table - Responsive Container */}
      {isLoading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="mt-3 text-gray-600 text-lg">Loading jobs...</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
          <JobTable
            jobs={filteredJobs}
            onViewDetails={viewJobDetails}
            onEdit={updateJob.mutateAsync}
            onDelete={(id) => deleteJob.mutate(id)}
          />
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={!hasPrevious}
            size="small"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={!hasNext}
            size="small"
          >
            Next
          </Button>
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
      <ReceiptTableModal
        key={currentReceiptData?.receipt_id || Date.now()}
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        receiptData={currentReceiptData}
        onVerify={handleReceiptVerification}
      />

  {showJobDetailModal && selectedJobForDetails && (
    <JobDetailModal
      job={selectedJobForDetails}
          isOpen={showJobDetailModal}
          onClose={() => {
            setShowJobDetailModal(false);
            setSelectedJobForDetails(null);
          }}
          onUpdateJob={updateJob.mutateAsync}
          onRemoveReceipt={removeReceipt}
          onClearAllReceipts={clearAllReceipts}
          onRemoveMaterial={removeMaterialFromJob.mutateAsync}
          onAddMaterial={addMaterialToJob.mutateAsync}
          onAddReceipt={handleReceiptUpload}
          products={products}
          productsLoading={productsLoading}
          productsError={productsError}
          showReceiptLoading={processingReceiptJobId === selectedJobForDetails?.id}
          setShowReceiptLoading={(show) => {
            if (!show) {
              // Reset processing state when loading is hidden
              setProcessingReceiptJobId(null);
            }
          }}
          onCompleteJob={async (jobId) => {
            const today = new Date().toISOString().split('T')[0];
            const updatedJob = {
              ...selectedJobForDetails,
              status: "COMPLETED",
              endDate: today
            };
            setSelectedJobForDetails(updatedJob);
            await updateJob.mutateAsync({ 
              id: jobId, 
              status: "COMPLETED", 
              endDate: today 
            });
          }}
        />
      )}
    </div>
  );
};

export default JobsListView;

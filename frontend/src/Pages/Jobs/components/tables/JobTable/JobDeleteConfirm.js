import React from "react";
import ConfirmModal from "../../../../../components/ConfirmModal";

const JobDeleteConfirm = ({ job, onCancel, onConfirm }) => {
  if (!job) return null;
  
  const customerDisplayName = job.customerName || job.customer?.name || job.customer?.username || "Unknown Customer";
  
  return (
    <ConfirmModal
      isOpen={!!job}
      title="Delete Job"
      message={`This will permanently delete the job "${job.title}".`}
      confirmLabel="Delete Job"
      confirmButtonClass="bg-red-600 hover:bg-red-700"
      onCancel={onCancel}
      onConfirm={() => onConfirm(job.id)}
      requireTextMatch={{
        expected: customerDisplayName,
        placeholder: customerDisplayName,
        help: `Type the customer's name to confirm: ${customerDisplayName}`,
      }}
    />
  );
};

export default JobDeleteConfirm;

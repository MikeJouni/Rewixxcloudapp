import React, { useState, useEffect } from 'react';
import ReceiptVerificationModal from './ReceiptVerificationModal';
import JobDetailModal from './JobDetailModal';
import config from '../config';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const [newJob, setNewJob] = useState({
    customerId: '',
    customerName: '',
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    estimatedHours: ''
  });

  useEffect(() => {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  const statusOptions = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddJob = (e) => {
    e.preventDefault();
    const job = {
      id: jobs.length + 1,
      ...newJob,
      actualHours: 0,
      receipts: [],
      materials: [],
      totalCost: 0
    };
    setJobs([...jobs, job]);
    setNewJob({
      customerId: '',
      customerName: '',
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      startDate: '',
      endDate: '',
      estimatedHours: ''
    });
    setShowAddForm(false);
  };

  const handleInputChange = (e) => {
    setNewJob({
      ...newJob,
      [e.target.name]: e.target.value
    });
  };

  const processReceiptWithVeryfi = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${config.API_BASE_URL}/api/receipts/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const receiptData = await response.json();
      return receiptData;
    } catch (error) {
      console.error('Error processing receipt with Veryfi:', error);
      throw error;
    }
  };

  const handleReceiptUpload = async (jobId, event) => {
    const file = event.target.files[0];
    if (file) {
      setProcessingReceipt(true);
      
      try {
        // Process receipt with Veryfi
        const receiptData = await processReceiptWithVeryfi(file);
        
        // Read file for display
        const reader = new FileReader();
        reader.onload = (e) => {
          const receiptInfo = {
            id: Date.now(),
            name: file.name,
            data: e.target.result,
            uploadedAt: new Date().toISOString(),
            extractedData: receiptData
          };
          
          // Store the receipt data for verification
          setCurrentReceiptData(receiptData);
          setCurrentJobId(jobId);
          setShowVerificationModal(true);
          
          // Add receipt to job (without materials yet)
          setJobs(jobs.map(job => {
            if (job.id === jobId) {
              return {
                ...job,
                receipts: [...(job.receipts || []), receiptInfo]
              };
            }
            return job;
          }));
        };
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error('Failed to process receipt:', error);
        alert('Failed to process receipt. Please try again or contact support.');
      } finally {
        setProcessingReceipt(false);
      }
    }
  };

  const handleReceiptVerification = (verifiedData) => {
    // Add verified items as materials to the job
    setJobs(jobs.map(job => {
      if (job.id === currentJobId) {
        // Convert verified items to materials format
        const newMaterials = verifiedData.items.map(item => ({
          id: Date.now() + Math.random(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
          supplier: currentReceiptData.vendor,
          category: 'Receipt Item',
          source: 'Receipt Scan (Verified)',
          notes: verifiedData.notes
        }));
        
        const updatedMaterials = [...(job.materials || []), ...newMaterials];
        
        // Update total cost
        const newTotalCost = (job.totalCost || 0) + verifiedData.total;
        
        return {
          ...job,
          materials: updatedMaterials,
          totalCost: newTotalCost
        };
      }
      return job;
    }));
    
    // Reset verification state
    setCurrentReceiptData(null);
    setCurrentJobId(null);
    setShowVerificationModal(false);
  };

  const viewReceipts = (job) => {
    setSelectedJobForReceipt(job);
    setShowReceiptModal(true);
  };

  const viewJobDetails = (job) => {
    setSelectedJobForDetails(job);
    setShowJobDetailModal(true);
  };

  const handleJobUpdate = (updatedJob) => {
    setJobs(jobs.map(job => job.id === updatedJob.id ? updatedJob : job));
    // Also update the selected job for details if it's the same job
    if (selectedJobForDetails && selectedJobForDetails.id === updatedJob.id) {
      setSelectedJobForDetails(updatedJob);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '#f39c12';
      case 'In Progress': return '#3498db';
      case 'Completed': return '#2ecc71';
      case 'Cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Low': return '#2ecc71';
      case 'Medium': return '#f39c12';
      case 'High': return '#e67e22';
      case 'Urgent': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Jobs</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add New Job'}
        </button>
      </div>

      {/* Add Job Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add New Job</h2>
          <form onSubmit={handleAddJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={newJob.customerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                type="text"
                name="title"
                value={newJob.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={newJob.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.filter(option => option !== 'All').map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={newJob.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={newJob.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={newJob.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                name="estimatedHours"
                value={newJob.estimatedHours}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={newJob.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Add Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
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
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours (Est/Act)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-semibold ${
                      job.priority === 'Low' ? 'text-green-600' :
                      job.priority === 'Medium' ? 'text-yellow-600' :
                      job.priority === 'High' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {job.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.startDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.endDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.estimatedHours} / {job.actualHours}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${job.totalCost?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.receipts ? job.receipts.length : 0} attached
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-1 flex-wrap">
                      <button 
                        onClick={() => viewJobDetails(job)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600"
                      >
                        View
                      </button>
                      <button className="px-2 py-1 text-xs bg-gray-500 text-white border-none rounded cursor-pointer hover:bg-gray-600">
                        Edit
                      </button>
                      {isMobile && (
                        <label className={`px-2 py-1 text-xs text-white border-none rounded cursor-pointer ${
                          processingReceipt 
                            ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                            : 'bg-green-500 hover:bg-green-600'
                        }`}>
                          {processingReceipt ? 'Processing...' : 'Attach Receipt'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleReceiptUpload(job.id, e)}
                            className="hidden"
                            disabled={processingReceipt}
                          />
                        </label>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredJobs.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '2rem' }}>
          No jobs found matching your criteria.
        </p>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedJobForReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Receipts for Job #{selectedJobForReceipt.id} - {selectedJobForReceipt.title}</h3>
              <button 
                onClick={() => setShowReceiptModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {selectedJobForReceipt.receipts && selectedJobForReceipt.receipts.map((receipt, index) => (
                <div key={receipt.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{receipt.name}</h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                    Uploaded: {new Date(receipt.uploadedAt).toLocaleDateString()}
                  </p>
                  
                  {/* Display extracted data if available */}
                  {receipt.extractedData && (
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '0.75rem', 
                      borderRadius: '4px', 
                      marginBottom: '0.75rem',
                      border: '1px solid #e9ecef'
                    }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#495057' }}>
                        Extracted Data
                      </h5>
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Vendor:</strong> {receipt.extractedData.vendor || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Date:</strong> {receipt.extractedData.date || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Total:</strong> ${receipt.extractedData.total?.toFixed(2) || '0.00'}
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Subtotal:</strong> ${receipt.extractedData.subtotal?.toFixed(2) || '0.00'}
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Tax:</strong> ${receipt.extractedData.tax?.toFixed(2) || '0.00'}
                        </p>
                        {receipt.extractedData.receipt_number && (
                          <p style={{ margin: '0.25rem 0' }}>
                            <strong>Receipt #:</strong> {receipt.extractedData.receipt_number}
                          </p>
                        )}
                      </div>
                      
                      {/* Display line items */}
                      {receipt.extractedData.items && receipt.extractedData.items.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#6c757d' }}>
                            Items ({receipt.extractedData.items.length})
                          </h6>
                          <div style={{ 
                            maxHeight: '150px', 
                            overflowY: 'auto', 
                            border: '1px solid #dee2e6',
                            borderRadius: '3px',
                            padding: '0.5rem',
                            backgroundColor: 'white'
                          }}>
                            {receipt.extractedData.items.map((item, itemIndex) => (
                              <div key={itemIndex} style={{ 
                                padding: '0.25rem 0', 
                                borderBottom: itemIndex < receipt.extractedData.items.length - 1 ? '1px solid #f1f3f4' : 'none',
                                fontSize: '0.8rem'
                              }}>
                                <div style={{ fontWeight: 'bold', color: '#495057' }}>
                                  {item.name}
                                </div>
                                <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                                  Qty: {item.quantity} × ${item.price?.toFixed(2)} = ${item.total?.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <img 
                    src={receipt.data} 
                    alt={receipt.name}
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      borderRadius: '4px',
                      border: '1px solid #eee'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Verification Modal */}
      <ReceiptVerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setCurrentReceiptData(null);
          setCurrentJobId(null);
        }}
        receiptData={currentReceiptData}
        onVerify={handleReceiptVerification}
        jobId={currentJobId}
      />

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJobForDetails}
        isOpen={showJobDetailModal}
        onClose={() => {
          setShowJobDetailModal(false);
          setSelectedJobForDetails(null);
        }}
        onUpdateJob={handleJobUpdate}
      />
    </div>
  );
};

export default Jobs;
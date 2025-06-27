import React, { useState, useEffect } from 'react';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
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
      receipts: []
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

  const handleReceiptUpload = (jobId, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const receiptData = {
          id: Date.now(),
          name: file.name,
          data: e.target.result,
          uploadedAt: new Date().toISOString()
        };
        
        setJobs(jobs.map(job => 
          job.id === jobId 
            ? { ...job, receipts: [...(job.receipts || []), receiptData] }
            : job
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const viewReceipts = (job) => {
    setSelectedJobForReceipt(job);
    setShowReceiptModal(true);
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
    <div className="component-container">
      <div className="component-header">
        <h2 className="component-title">Job Management</h2>
        <button 
          className="primary-button" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Create New Job'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddJob} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Create New Job</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={newJob.customerName}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input
                type="text"
                name="title"
                value={newJob.title}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={newJob.description}
                onChange={handleInputChange}
                className="form-input"
                rows="3"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={newJob.priority}
                onChange={handleInputChange}
                className="form-input"
              >
                {priorityOptions.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Hours</label>
              <input
                type="number"
                name="estimatedHours"
                value={newJob.estimatedHours}
                onChange={handleInputChange}
                className="form-input"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={newJob.startDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                name="endDate"
                value={newJob.endDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>
          <button type="submit" className="primary-button">Create Job</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
          style={{ marginBottom: 0, flex: '1', minWidth: '200px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: '200px', marginBottom: 0 }}
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Hours (Est/Act)</th>
              <th>Receipts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map(job => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.customerName}</td>
                <td>{job.title}</td>
                <td>
                  <span style={{ 
                    color: getStatusColor(job.status), 
                    fontWeight: 'bold',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '3px',
                    backgroundColor: getStatusColor(job.status) + '20'
                  }}>
                    {job.status}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    color: getPriorityColor(job.priority),
                    fontWeight: 'bold'
                  }}>
                    {job.priority}
                  </span>
                </td>
                <td>{job.startDate}</td>
                <td>{job.endDate}</td>
                <td>{job.estimatedHours} / {job.actualHours}</td>
                <td>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    {job.receipts ? job.receipts.length : 0} attached
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    <button style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                      View
                    </button>
                    <button style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                      Edit
                    </button>
                    {isMobile && (
                      <label style={{ 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.875rem',
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        margin: '0'
                      }}>
                        Attach Receipt
                        <input
                          type="file"
                          accept="image/*;capture=environment"
                          style={{ display: 'none' }}
                          onChange={(e) => handleReceiptUpload(job.id, e)}
                        />
                      </label>
                    )}
                    {(job.receipts && job.receipts.length > 0) && (
                      <button 
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.875rem',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px'
                        }}
                        onClick={() => viewReceipts(job)}
                      >
                        View Receipts
                      </button>
                    )}
                    <button style={{ 
                      padding: '0.25rem 0.5rem', 
                      fontSize: '0.875rem', 
                      backgroundColor: '#e74c3c', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '3px' 
                    }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  );
};

export default Jobs;
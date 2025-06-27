import React, { useState, useEffect } from 'react';

const Reports = () => {
  const [reportType, setReportType] = useState('customer');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Mock data 
  useEffect(() => {
    setCustomers([
      { id: 1, name: 'John Smith', email: 'john@example.com', phone: '555-0101' },
      { id: 2, name: 'Jane Doe', email: 'jane@example.com', phone: '555-0102' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '555-0103' }
    ]);

    setJobs([
      { id: 1, customerName: 'John Smith', title: 'Kitchen Remodel', status: 'Completed', estimatedHours: 40, actualHours: 42, startDate: '2024-01-15', endDate: '2024-02-15' },
      { id: 2, customerName: 'Jane Doe', title: 'Bathroom Update', status: 'In Progress', estimatedHours: 20, actualHours: 15, startDate: '2024-02-01', endDate: '2024-02-20' },
      { id: 3, customerName: 'Bob Johnson', title: 'Electrical Panel Upgrade', status: 'Pending', estimatedHours: 8, actualHours: 0, startDate: '2024-03-01', endDate: '2024-03-02' }
    ]);
  }, []);

  const generateReport = () => {
    let report = null;

    if (reportType === 'customer' && selectedCustomer) {
      const customer = customers.find(c => c.id === parseInt(selectedCustomer));
      const customerJobs = jobs.filter(job => job.customerName === customer.name);
      
      report = {
        type: 'Customer Report',
        customer: customer,
        jobs: customerJobs,
        summary: {
          totalJobs: customerJobs.length,
          completedJobs: customerJobs.filter(job => job.status === 'Completed').length,
          inProgressJobs: customerJobs.filter(job => job.status === 'In Progress').length,
          pendingJobs: customerJobs.filter(job => job.status === 'Pending').length,
          totalEstimatedHours: customerJobs.reduce((sum, job) => sum + job.estimatedHours, 0),
          totalActualHours: customerJobs.reduce((sum, job) => sum + job.actualHours, 0)
        }
      };
    } else if (reportType === 'job' && selectedJob) {
      const job = jobs.find(j => j.id === parseInt(selectedJob));
      
      report = {
        type: 'Job Report',
        job: job,
        summary: {
          status: job.status,
          estimatedHours: job.estimatedHours,
          actualHours: job.actualHours,
          efficiency: job.actualHours > 0 ? ((job.estimatedHours / job.actualHours) * 100).toFixed(1) : 'N/A',
          duration: job.startDate && job.endDate ? 
            Math.ceil((new Date(job.endDate) - new Date(job.startDate)) / (1000 * 60 * 60 * 24)) : 'N/A'
        }
      };
    }

    setGeneratedReport(report);
    setShowReport(true);
  };

  const exportReport = () => {
    if (!generatedReport) return;

    let content = '';
    if (generatedReport.type === 'Customer Report') {
      content = `Customer Report: ${generatedReport.customer.name}
Generated: ${new Date().toLocaleDateString()}

Customer Information:
- Name: ${generatedReport.customer.name}
- Email: ${generatedReport.customer.email}
- Phone: ${generatedReport.customer.phone}

Summary:
- Total Jobs: ${generatedReport.summary.totalJobs}
- Completed: ${generatedReport.summary.completedJobs}
- In Progress: ${generatedReport.summary.inProgressJobs}
- Pending: ${generatedReport.summary.pendingJobs}
- Total Estimated Hours: ${generatedReport.summary.totalEstimatedHours}
- Total Actual Hours: ${generatedReport.summary.totalActualHours}

Jobs:
${generatedReport.jobs.map(job => `- ${job.title} (${job.status}) - Est: ${job.estimatedHours}h, Act: ${job.actualHours}h`).join('\n')}`;
    } else {
      content = `Job Report: ${generatedReport.job.title}
Generated: ${new Date().toLocaleDateString()}

Job Information:
- Title: ${generatedReport.job.title}
- Customer: ${generatedReport.job.customerName}
- Status: ${generatedReport.job.status}
- Start Date: ${generatedReport.job.startDate}
- End Date: ${generatedReport.job.endDate}

Summary:
- Estimated Hours: ${generatedReport.summary.estimatedHours}
- Actual Hours: ${generatedReport.summary.actualHours}
- Efficiency: ${generatedReport.summary.efficiency}%
- Duration: ${generatedReport.summary.duration} days`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedReport.type.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <h2 className="component-title">Reports</h2>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          padding: '1.5rem', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Generate Report</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="form-input"
            >
              <option value="customer">Customer Report</option>
              <option value="job">Job Report</option>
            </select>
          </div>

          {reportType === 'customer' && (
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Select Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="form-input"
              >
                <option value="">Choose a customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'job' && (
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Select Job</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="form-input"
              >
                <option value="">Choose a job...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    #{job.id} - {job.title} ({job.customerName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            className="primary-button"
            onClick={generateReport}
            disabled={!((reportType === 'customer' && selectedCustomer) || (reportType === 'job' && selectedJob))}
            style={{ width: '100%' }}
          >
            Generate Report
          </button>
        </div>

        {showReport && generatedReport && (
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            backgroundColor: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>{generatedReport.type}</h3>
              <button 
                onClick={exportReport}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Export
              </button>
            </div>

            {generatedReport.type === 'Customer Report' && (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Customer Information</h4>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                    <strong>Name:</strong> {generatedReport.customer.name}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                    <strong>Email:</strong> {generatedReport.customer.email}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                    <strong>Phone:</strong> {generatedReport.customer.phone}
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                        {generatedReport.summary.totalJobs}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Total Jobs</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                        {generatedReport.summary.completedJobs}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Completed</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                        {generatedReport.summary.inProgressJobs}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>In Progress</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {generatedReport.summary.pendingJobs}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Pending</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Jobs</h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {generatedReport.jobs.map(job => (
                      <div key={job.id} style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '6px', 
                        marginBottom: '0.5rem',
                        backgroundColor: '#f9fafb'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{job.title}</div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                          Status: {job.status} | Est: {job.estimatedHours}h | Act: {job.actualHours}h
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {generatedReport.type === 'Job Report' && (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Job Information</h4>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                    <strong>Title:</strong> {generatedReport.job.title}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                    <strong>Customer:</strong> {generatedReport.job.customerName}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                    <strong>Status:</strong> {generatedReport.job.status}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                    <strong>Start Date:</strong> {generatedReport.job.startDate}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                    <strong>End Date:</strong> {generatedReport.job.endDate}
                  </p>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                        {generatedReport.summary.estimatedHours}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Est. Hours</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                        {generatedReport.summary.actualHours}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Act. Hours</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                        {generatedReport.summary.efficiency}%
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Efficiency</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {generatedReport.summary.duration}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Days</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 
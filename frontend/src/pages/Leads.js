import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { leadService } from '../services/leadService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import TooltipButton from '../components/common/TooltipButton';
import '../styles/crm.css';

const Leads = () => {
  const { user, hasPermission } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    leadStatus: '',
    leadSource: '',
    rating: ''
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    leadSource: 'Other',
    leadStatus: 'New',
    rating: 'Warm',
    industry: '',
    website: '',
    description: ''
  });

  useEffect(() => {
    loadLeads();
  }, [pagination.page, filters]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await leadService.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      console.log('=== LEAD RESPONSE DEBUG ===');
      console.log('Full response:', response);
      console.log('response.success:', response?.success);
      console.log('response.data:', response?.data);
      console.log('response.data.leads:', response?.data?.leads);
      console.log('Type of response:', typeof response);
      console.log('Is array?', Array.isArray(response));

      // Check if response has the expected structure
      if (response && response.success === true && response.data) {
        const leadsData = response.data.leads || [];
        console.log('Setting leads:', leadsData);
        setLeads(leadsData);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));
      } else {
        console.log('Response validation failed - setting error');
        setError(response?.message || 'Failed to load leads - invalid response');
      }
    } catch (err) {
      console.error('Load leads CATCH error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await leadService.createLead(formData);
      setSuccess('Lead created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lead');
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await leadService.updateLead(selectedLead._id, formData);
      setSuccess('Lead updated successfully!');
      setShowEditModal(false);
      setSelectedLead(null);
      resetForm();
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update lead');
    }
  };

  const handleDeleteLead = async () => {
    try {
      setError('');
      await leadService.deleteLead(selectedLead._id);
      setSuccess('Lead deleted successfully!');
      setShowDeleteModal(false);
      setSelectedLead(null);
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setFormData({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      jobTitle: lead.jobTitle || '',
      leadSource: lead.leadSource,
      leadStatus: lead.leadStatus,
      rating: lead.rating,
      industry: lead.industry || '',
      website: lead.website || '',
      description: lead.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (lead) => {
    setSelectedLead(lead);
    setShowDeleteModal(true);
  };

  // Conversion form state
  const [conversionData, setConversionData] = useState({
    createAccount: true,
    createContact: true,
    createOpportunity: false,
    accountName: '',
    opportunityName: '',
    opportunityAmount: '',
    closeDate: ''
  });

  const openConvertModal = (lead) => {
    setSelectedLead(lead);
    // Pre-fill conversion data
    setConversionData({
      createAccount: true,
      createContact: true,
      createOpportunity: false,
      accountName: lead.company || `${lead.firstName} ${lead.lastName}`,
      opportunityName: `${lead.company || lead.firstName + ' ' + lead.lastName} - Opportunity`,
      opportunityAmount: '',
      closeDate: ''
    });
    setShowConvertModal(true);
  };

  const handleConversionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConversionData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        createAccount: conversionData.createAccount,
        createContact: conversionData.createContact,
        accountData: conversionData.createAccount ? {
          accountName: conversionData.accountName,
          accountType: 'Customer',
          industry: selectedLead.industry,
          website: selectedLead.website,
          phone: selectedLead.phone,
          email: selectedLead.email,
          street: selectedLead.street,
          city: selectedLead.city,
          state: selectedLead.state,
          country: selectedLead.country,
          zipCode: selectedLead.zipCode
        } : {},
        contactData: conversionData.createContact ? {
          firstName: selectedLead.firstName,
          lastName: selectedLead.lastName,
          email: selectedLead.email,
          phone: selectedLead.phone,
          jobTitle: selectedLead.jobTitle
        } : {}
      };

      const response = await leadService.convertLead(selectedLead._id, payload);

      if (response.success) {
        setSuccess('Lead converted successfully!');
        setShowConvertModal(false);
        loadLeads();

        // If creating opportunity, handle that
        if (conversionData.createOpportunity && response.data.account) {
          // Import opportunityService at top first
          const { opportunityService } = await import('../services/opportunityService');

          await opportunityService.createOpportunity({
            opportunityName: conversionData.opportunityName,
            amount: parseFloat(conversionData.opportunityAmount),
            closeDate: conversionData.closeDate,
            account: response.data.account._id,
            contact: response.data.contact?._id,
            lead: selectedLead._id,
            stage: 'Qualification',
            probability: 50,
            type: 'New Business',
            leadSource: selectedLead.leadSource
          });
        }

        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to convert lead');
      }
    } catch (err) {
      console.error('Convert lead error:', err);
      setError(err.response?.data?.message || 'Failed to convert lead');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      leadSource: 'Other',
      leadStatus: 'New',
      rating: 'Warm',
      industry: '',
      website: '',
      description: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const canCreateLead = hasPermission('lead_management', 'create');
  const canUpdateLead = hasPermission('lead_management', 'update');
  const canDeleteLead = hasPermission('lead_management', 'delete');
  const canConvertLead = hasPermission('lead_management', 'convert');
  const canImportLeads = hasPermission('lead_management', 'import');

  const actionButton = (
    <TooltipButton
      className="header-action-btn"
      onClick={openCreateModal}
      disabled={!canCreateLead}
      tooltipText="You don't have permission to create leads"
    >
      + New Lead
    </TooltipButton>
  );

  return (
    <DashboardLayout title="Leads" actionButton={actionButton}>
      {/* Debug info */}
    

      {success && (
        <div style={{ padding: '16px', background: '#DCFCE7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="crm-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <input
            type="text"
            name="search"
            placeholder="Search leads..."
            className="crm-form-input"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select
            name="leadStatus"
            className="crm-form-select"
            value={filters.leadStatus}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Unqualified">Unqualified</option>
            <option value="Lost">Lost</option>
          </select>
          <select
            name="leadSource"
            className="crm-form-select"
            value={filters.leadSource}
            onChange={handleFilterChange}
          >
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Campaign">Campaign</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Social Media">Social Media</option>
          </select>
          <select
            name="rating"
            className="crm-form-select"
            value={filters.rating}
            onChange={handleFilterChange}
          >
            <option value="">All Ratings</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
          {canImportLeads && (
            <button
              className="crm-btn crm-btn-secondary"
              onClick={() => setShowBulkUploadModal(true)}
            >
              📤 Bulk Upload
            </button>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title">All Leads ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '10px' }}>Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>No leads found. Create your first lead!</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Rating</th>
                    <th>Owner</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead._id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>
                          {lead.firstName} {lead.lastName}
                        </div>
                        {lead.jobTitle && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {lead.jobTitle}
                          </div>
                        )}
                      </td>
                      <td>{lead.company || '-'}</td>
                      <td>{lead.email}</td>
                      <td>{lead.phone || '-'}</td>
                      <td>
                        <span className={`status-badge ${(lead.leadStatus || 'new').toLowerCase()}`}>
                          {lead.leadStatus || 'New'}
                        </span>
                      </td>
                      <td>{lead.leadSource || '-'}</td>
                      <td>
                        <span className={`rating-badge ${(lead.rating || 'warm').toLowerCase()}`}>
                          {lead.rating || 'Warm'}
                        </span>
                      </td>
                      <td>
                        {lead.owner ? `${lead.owner.firstName || ''} ${lead.owner.lastName || ''}` : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!lead.isConverted && (
                            <TooltipButton
                              className="crm-btn crm-btn-sm crm-btn-success"
                              onClick={() => openConvertModal(lead)}
                              disabled={!canConvertLead}
                              tooltipText="You don't have permission to convert leads"
                            >
                              Convert
                            </TooltipButton>
                          )}
                          <TooltipButton
                            className="crm-btn crm-btn-sm crm-btn-secondary"
                            onClick={() => openEditModal(lead)}
                            disabled={!canUpdateLead}
                            tooltipText="You don't have permission to edit leads"
                          >
                            Edit
                          </TooltipButton>
                          <TooltipButton
                            className="crm-btn crm-btn-sm crm-btn-danger"
                            onClick={() => openDeleteModal(lead)}
                            disabled={!canDeleteLead}
                            tooltipText="You don't have permission to delete leads"
                          >
                            Delete
                          </TooltipButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
                <button
                  className="crm-btn crm-btn-secondary crm-btn-sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="crm-btn crm-btn-secondary crm-btn-sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Lead Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
          setError('');
        }}
        title="Create New Lead"
        size="large"
      >
        <form onSubmit={handleCreateLead}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="crm-form-group">
              <label className="crm-form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                className="crm-form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="crm-form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="crm-form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                className="crm-form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Company</label>
              <input
                type="text"
                name="company"
                className="crm-form-input"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                className="crm-form-input"
                value={formData.jobTitle}
                onChange={handleChange}
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Lead Source</label>
              <select
                name="leadSource"
                className="crm-form-select"
                value={formData.leadSource}
                onChange={handleChange}
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Campaign">Campaign</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Trade Show">Trade Show</option>
                <option value="Partner">Partner</option>
                <option value="Social Media">Social Media</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Lead Status</label>
              <select
                name="leadStatus"
                className="crm-form-select"
                value={formData.leadStatus}
                onChange={handleChange}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Rating</label>
              <select
                name="rating"
                className="crm-form-select"
                value={formData.rating}
                onChange={handleChange}
              >
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Industry</label>
              <input
                type="text"
                name="industry"
                className="crm-form-input"
                value={formData.industry}
                onChange={handleChange}
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Website</label>
              <input
                type="url"
                name="website"
                className="crm-form-input"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="crm-form-group">
            <label className="crm-form-label">Description</label>
            <textarea
              name="description"
              className="crm-form-textarea"
              rows="3"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="crm-btn crm-btn-secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">
              Create Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Lead Modal - Same as Create but with Update */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLead(null);
          resetForm();
          setError('');
        }}
        title="Edit Lead"
        size="large"
      >
        <form onSubmit={handleUpdateLead}>
          {/* Same form fields as create */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="crm-form-group">
              <label className="crm-form-label">First Name *</label>
              <input
                type="text"
                name="firstName"
                className="crm-form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="crm-form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="crm-form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                className="crm-form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Company</label>
              <input
                type="text"
                name="company"
                className="crm-form-input"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                className="crm-form-input"
                value={formData.jobTitle}
                onChange={handleChange}
              />
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Lead Status</label>
              <select
                name="leadStatus"
                className="crm-form-select"
                value={formData.leadStatus}
                onChange={handleChange}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Rating</label>
              <select
                name="rating"
                className="crm-form-select"
                value={formData.rating}
                onChange={handleChange}
              >
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="crm-btn crm-btn-secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedLead(null);
                resetForm();
                setError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">
              Update Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLead(null);
        }}
        title="Delete Lead"
        size="small"
      >
        <div>
          <p>Are you sure you want to delete this lead?</p>
          <p style={{ marginTop: '10px', fontWeight: '600' }}>
            {selectedLead?.firstName} {selectedLead?.lastName}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {selectedLead?.company} • {selectedLead?.email}
          </p>
          <p style={{ marginTop: '15px', color: '#E74C3C', fontSize: '14px' }}>
            This action cannot be undone.
          </p>

          <div className="modal-footer">
            <button
              className="crm-btn crm-btn-secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedLead(null);
              }}
            >
              Cancel
            </button>
            <button
              className="crm-btn crm-btn-danger"
              onClick={handleDeleteLead}
            >
              Delete Lead
            </button>
          </div>
        </div>
      </Modal>

      {/* Convert Modal */}
      {showConvertModal && selectedLead && (
        <div className="crm-modal-overlay" onClick={() => setShowConvertModal(false)}>
          <div className="crm-modal crm-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>Convert Lead</h3>
              <button
                className="crm-modal-close"
                onClick={() => setShowConvertModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleConvertLead}>
              <div className="crm-modal-body">
                {/* Lead Info */}
                <div className="crm-card" style={{ marginBottom: '20px', background: '#f8f9fa' }}>
                  <div className="crm-card-body">
                    <h4 style={{ marginBottom: '10px' }}>Lead Information</h4>
                    <p><strong>Name:</strong> {selectedLead.firstName} {selectedLead.lastName}</p>
                    <p><strong>Email:</strong> {selectedLead.email}</p>
                    <p><strong>Company:</strong> {selectedLead.company || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedLead.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Account Creation */}
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-checkbox-label">
                      <input
                        type="checkbox"
                        name="createAccount"
                        checked={conversionData.createAccount}
                        onChange={handleConversionChange}
                      />
                      <span>Create Account</span>
                    </label>
                  </div>
                </div>

                {conversionData.createAccount && (
                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Account Name *</label>
                      <input
                        type="text"
                        name="accountName"
                        value={conversionData.accountName}
                        onChange={handleConversionChange}
                        className="crm-input"
                        required={conversionData.createAccount}
                      />
                      <small className="crm-help-text">
                        Will use lead's company name or full name as account name
                      </small>
                    </div>
                  </div>
                )}

                {/* Contact Creation */}
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-checkbox-label">
                      <input
                        type="checkbox"
                        name="createContact"
                        checked={conversionData.createContact}
                        onChange={handleConversionChange}
                      />
                      <span>Create Contact</span>
                    </label>
                    <small className="crm-help-text">
                      Will use lead's personal information to create contact
                    </small>
                  </div>
                </div>

                {/* Opportunity Creation */}
                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-checkbox-label">
                      <input
                        type="checkbox"
                        name="createOpportunity"
                        checked={conversionData.createOpportunity}
                        onChange={handleConversionChange}
                        disabled={!conversionData.createAccount}
                      />
                      <span>Create Opportunity</span>
                    </label>
                    {!conversionData.createAccount && (
                      <small className="crm-help-text crm-text-muted">
                        (Requires account creation)
                      </small>
                    )}
                  </div>
                </div>

                {conversionData.createOpportunity && conversionData.createAccount && (
                  <>
                    <div className="crm-form-row">
                      <div className="crm-form-group">
                        <label className="crm-label">Opportunity Name *</label>
                        <input
                          type="text"
                          name="opportunityName"
                          value={conversionData.opportunityName}
                          onChange={handleConversionChange}
                          className="crm-input"
                          required={conversionData.createOpportunity}
                        />
                      </div>
                    </div>
                    <div className="crm-form-row">
                      <div className="crm-form-group">
                        <label className="crm-label">Amount *</label>
                        <input
                          type="number"
                          name="opportunityAmount"
                          value={conversionData.opportunityAmount}
                          onChange={handleConversionChange}
                          className="crm-input"
                          min="0"
                          step="0.01"
                          required={conversionData.createOpportunity}
                        />
                      </div>
                      <div className="crm-form-group">
                        <label className="crm-label">Expected Close Date *</label>
                        <input
                          type="date"
                          name="closeDate"
                          value={conversionData.closeDate}
                          onChange={handleConversionChange}
                          className="crm-input"
                          required={conversionData.createOpportunity}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="crm-alert crm-alert-info" style={{ marginTop: '20px' }}>
                  <strong>Note:</strong> The lead will be marked as "Converted" and will no longer appear in the active leads list.
                </div>
              </div>
              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn crm-btn-secondary"
                  onClick={() => setShowConvertModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="crm-btn crm-btn-primary"
                  disabled={!conversionData.createAccount && !conversionData.createContact}
                >
                  Convert Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showBulkUploadModal && (
        <div>Bulk upload modal - To be implemented</div>
      )}
    </DashboardLayout>
  );
};

export default Leads;

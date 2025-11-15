import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { opportunityService } from '../services/opportunityService';
import { accountService } from '../services/accountService';
import { contactService } from '../services/contactService';
import '../styles/crm.css';

const Opportunities = () => {
  const { hasPermission } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
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
    stage: '',
    account: '',
    minAmount: '',
    maxAmount: ''
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    opportunityName: '',
    amount: '',
    stage: 'Prospecting',
    probability: '10',
    closeDate: '',
    account: '',
    contact: '',
    type: 'New Business',
    leadSource: '',
    nextStep: '',
    description: ''
  });

  // Permission checks
  const canCreate = hasPermission('opportunity_management', 'create');
  const canUpdate = hasPermission('opportunity_management', 'update');
  const canDelete = hasPermission('opportunity_management', 'delete');

  // Load opportunities
  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await opportunityService.getOpportunities({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      if (response.success && response.data) {
        setOpportunities(response.data.opportunities || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));
      } else {
        setError('Failed to load opportunities');
      }
    } catch (err) {
      console.error('Load opportunities error:', err);
      setError(err.response?.data?.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Load accounts for dropdown
  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts({ limit: 1000 });
      if (response.success && response.data) {
        setAccounts(response.data.accounts || []);
      }
    } catch (err) {
      console.error('Load accounts error:', err);
    }
  };

  // Load contacts when account is selected
  const loadContactsForAccount = async (accountId) => {
    if (!accountId) {
      setContacts([]);
      return;
    }

    try {
      const response = await contactService.getContacts({ account: accountId, limit: 1000 });
      if (response.success && response.data) {
        setContacts(response.data.contacts || []);
      }
    } catch (err) {
      console.error('Load contacts error:', err);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [pagination.page, filters]);

  useEffect(() => {
    loadAccounts();
  }, []);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Load contacts when account changes
    if (name === 'account') {
      loadContactsForAccount(value);
      setFormData(prev => ({ ...prev, contact: '' }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      opportunityName: '',
      amount: '',
      stage: 'Prospecting',
      probability: '10',
      closeDate: '',
      account: '',
      contact: '',
      type: 'New Business',
      leadSource: '',
      nextStep: '',
      description: ''
    });
    setContacts([]);
  };

  // Create opportunity
  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await opportunityService.createOpportunity(formData);

      if (response.success) {
        setSuccess('Opportunity created successfully');
        setShowCreateModal(false);
        resetForm();
        loadOpportunities();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to create opportunity');
      }
    } catch (err) {
      console.error('Create opportunity error:', err);
      setError(err.response?.data?.message || 'Failed to create opportunity');
    }
  };

  // Edit opportunity
  const handleEditClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setFormData({
      opportunityName: opportunity.opportunityName,
      amount: opportunity.amount.toString(),
      stage: opportunity.stage,
      probability: opportunity.probability.toString(),
      closeDate: new Date(opportunity.closeDate).toISOString().split('T')[0],
      account: opportunity.account?._id || '',
      contact: opportunity.contact?._id || '',
      type: opportunity.type,
      leadSource: opportunity.leadSource || '',
      nextStep: opportunity.nextStep || '',
      description: opportunity.description || ''
    });
    if (opportunity.account?._id) {
      loadContactsForAccount(opportunity.account._id);
    }
    setShowEditModal(true);
  };

  const handleUpdateOpportunity = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await opportunityService.updateOpportunity(selectedOpportunity._id, formData);

      if (response.success) {
        setSuccess('Opportunity updated successfully');
        setShowEditModal(false);
        resetForm();
        loadOpportunities();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to update opportunity');
      }
    } catch (err) {
      console.error('Update opportunity error:', err);
      setError(err.response?.data?.message || 'Failed to update opportunity');
    }
  };

  // Delete opportunity
  const handleDeleteClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowDeleteModal(true);
  };

  const handleDeleteOpportunity = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await opportunityService.deleteOpportunity(selectedOpportunity._id);

      if (response.success) {
        setSuccess('Opportunity deleted successfully');
        setShowDeleteModal(false);
        setSelectedOpportunity(null);
        loadOpportunities();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to delete opportunity');
      }
    } catch (err) {
      console.error('Delete opportunity error:', err);
      setError(err.response?.data?.message || 'Failed to delete opportunity');
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get stage badge class
  const getStageBadge = (stage) => {
    const badgeClasses = {
      'Prospecting': 'crm-badge-info',
      'Qualification': 'crm-badge-info',
      'Needs Analysis': 'crm-badge-warning',
      'Value Proposition': 'crm-badge-warning',
      'Proposal/Price Quote': 'crm-badge-warning',
      'Negotiation/Review': 'crm-badge-primary',
      'Closed Won': 'crm-badge-success',
      'Closed Lost': 'crm-badge-danger'
    };
    return badgeClasses[stage] || 'crm-badge-secondary';
  };

  // Action button for header
  const actionButton = canCreate ? (
    <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateModal(true)}>
      + New Opportunity
    </button>
  ) : null;

  return (
    <DashboardLayout title="Opportunities" actionButton={actionButton}>
      <div className="crm-page">
        {/* Alerts */}
        {error && (
          <div className="crm-alert crm-alert-danger">
            {error}
          </div>
        )}
        {success && (
          <div className="crm-alert crm-alert-success">
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="crm-card">
          <div className="crm-card-header">
            <h3>Filters</h3>
          </div>
          <div className="crm-card-body">
            <div className="crm-filters">
              <input
                type="text"
                name="search"
                placeholder="Search opportunities..."
                value={filters.search}
                onChange={handleFilterChange}
                className="crm-input"
              />
              <select
                name="stage"
                value={filters.stage}
                onChange={handleFilterChange}
                className="crm-input"
              >
                <option value="">All Stages</option>
                <option value="Prospecting">Prospecting</option>
                <option value="Qualification">Qualification</option>
                <option value="Needs Analysis">Needs Analysis</option>
                <option value="Value Proposition">Value Proposition</option>
                <option value="Proposal/Price Quote">Proposal/Price Quote</option>
                <option value="Negotiation/Review">Negotiation/Review</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
              <select
                name="account"
                value={filters.account}
                onChange={handleFilterChange}
                className="crm-input"
              >
                <option value="">All Accounts</option>
                {accounts.map(account => (
                  <option key={account._id} value={account._id}>
                    {account.accountName}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="minAmount"
                placeholder="Min Amount"
                value={filters.minAmount}
                onChange={handleFilterChange}
                className="crm-input"
              />
              <input
                type="number"
                name="maxAmount"
                placeholder="Max Amount"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                className="crm-input"
              />
            </div>
          </div>
        </div>

        {/* Opportunities Table */}
        <div className="crm-card">
          <div className="crm-card-header">
            <h3>Opportunities ({pagination.total})</h3>
          </div>
          <div className="crm-card-body">
            {loading ? (
              <div className="crm-loading">Loading opportunities...</div>
            ) : opportunities.length === 0 ? (
              <div className="crm-empty">
                <p>No opportunities found</p>
              </div>
            ) : (
              <div className="crm-table-responsive">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Opportunity Name</th>
                      <th>Account</th>
                      <th>Amount</th>
                      <th>Stage</th>
                      <th>Probability</th>
                      <th>Close Date</th>
                      <th>Owner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map(opportunity => (
                      <tr key={opportunity._id}>
                        <td>{opportunity.opportunityName}</td>
                        <td>
                          {opportunity.account?.accountName || 'N/A'}
                        </td>
                        <td>{formatCurrency(opportunity.amount)}</td>
                        <td>
                          <span className={`crm-badge ${getStageBadge(opportunity.stage)}`}>
                            {opportunity.stage}
                          </span>
                        </td>
                        <td>{opportunity.probability}%</td>
                        <td>{formatDate(opportunity.closeDate)}</td>
                        <td>
                          {opportunity.owner ? `${opportunity.owner.firstName} ${opportunity.owner.lastName}` : 'N/A'}
                        </td>
                        <td>
                          <div className="crm-btn-group">
                            {canUpdate && (
                              <button
                                className="crm-btn crm-btn-sm crm-btn-primary"
                                onClick={() => handleEditClick(opportunity)}
                              >
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="crm-btn crm-btn-sm crm-btn-danger"
                                onClick={() => handleDeleteClick(opportunity)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="crm-pagination">
                <button
                  className="crm-btn crm-btn-secondary"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>
                <span className="crm-pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="crm-btn crm-btn-secondary"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="crm-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="crm-modal-header">
                <h3>Create New Opportunity</h3>
                <button
                  className="crm-modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleCreateOpportunity}>
                <div className="crm-modal-body">
                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Opportunity Name *</label>
                      <input
                        type="text"
                        name="opportunityName"
                        value={formData.opportunityName}
                        onChange={handleFormChange}
                        className="crm-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Account *</label>
                      <select
                        name="account"
                        value={formData.account}
                        onChange={handleFormChange}
                        className="crm-input"
                        required
                      >
                        <option value="">Select Account</option>
                        {accounts.map(account => (
                          <option key={account._id} value={account._id}>
                            {account.accountName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="crm-form-group">
                      <label className="crm-label">Contact</label>
                      <select
                        name="contact"
                        value={formData.contact}
                        onChange={handleFormChange}
                        className="crm-input"
                        disabled={!formData.account}
                      >
                        <option value="">Select Contact (Optional)</option>
                        {contacts.map(contact => (
                          <option key={contact._id} value={contact._id}>
                            {contact.firstName} {contact.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Amount *</label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleFormChange}
                        className="crm-input"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="crm-form-group">
                      <label className="crm-label">Close Date *</label>
                      <input
                        type="date"
                        name="closeDate"
                        value={formData.closeDate}
                        onChange={handleFormChange}
                        className="crm-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Stage</label>
                      <select
                        name="stage"
                        value={formData.stage}
                        onChange={handleFormChange}
                        className="crm-input"
                      >
                        <option value="Prospecting">Prospecting</option>
                        <option value="Qualification">Qualification</option>
                        <option value="Needs Analysis">Needs Analysis</option>
                        <option value="Value Proposition">Value Proposition</option>
                        <option value="Proposal/Price Quote">Proposal/Price Quote</option>
                        <option value="Negotiation/Review">Negotiation/Review</option>
                        <option value="Closed Won">Closed Won</option>
                        <option value="Closed Lost">Closed Lost</option>
                      </select>
                    </div>
                    <div className="crm-form-group">
                      <label className="crm-label">Probability (%)</label>
                      <input
                        type="number"
                        name="probability"
                        value={formData.probability}
                        onChange={handleFormChange}
                        className="crm-input"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleFormChange}
                        className="crm-input"
                      >
                        <option value="New Business">New Business</option>
                        <option value="Existing Business">Existing Business</option>
                        <option value="Renewal">Renewal</option>
                      </select>
                    </div>
                    <div className="crm-form-group">
                      <label className="crm-label">Lead Source</label>
                      <select
                        name="leadSource"
                        value={formData.leadSource}
                        onChange={handleFormChange}
                        className="crm-input"
                      >
                        <option value="">Select Source</option>
                        <option value="Web">Web</option>
                        <option value="Phone Inquiry">Phone Inquiry</option>
                        <option value="Partner Referral">Partner Referral</option>
                        <option value="Purchased List">Purchased List</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Next Step</label>
                      <input
                        type="text"
                        name="nextStep"
                        value={formData.nextStep}
                        onChange={handleFormChange}
                        className="crm-input"
                      />
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        className="crm-input"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="crm-modal-footer">
                  <button
                    type="button"
                    className="crm-btn crm-btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="crm-btn crm-btn-primary">
                    Create Opportunity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="crm-modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="crm-modal-header">
                <h3>Edit Opportunity</h3>
                <button
                  className="crm-modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleUpdateOpportunity}>
                <div className="crm-modal-body">
                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Opportunity Name *</label>
                      <input
                        type="text"
                        name="opportunityName"
                        value={formData.opportunityName}
                        onChange={handleFormChange}
                        className="crm-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Contact</label>
                      <select
                        name="contact"
                        value={formData.contact}
                        onChange={handleFormChange}
                        className="crm-input"
                      >
                        <option value="">Select Contact (Optional)</option>
                        {contacts.map(contact => (
                          <option key={contact._id} value={contact._id}>
                            {contact.firstName} {contact.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Amount *</label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleFormChange}
                        className="crm-input"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="crm-form-group">
                      <label className="crm-label">Close Date *</label>
                      <input
                        type="date"
                        name="closeDate"
                        value={formData.closeDate}
                        onChange={handleFormChange}
                        className="crm-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Stage</label>
                      <select
                        name="stage"
                        value={formData.stage}
                        onChange={handleFormChange}
                        className="crm-input"
                      >
                        <option value="Prospecting">Prospecting</option>
                        <option value="Qualification">Qualification</option>
                        <option value="Needs Analysis">Needs Analysis</option>
                        <option value="Value Proposition">Value Proposition</option>
                        <option value="Proposal/Price Quote">Proposal/Price Quote</option>
                        <option value="Negotiation/Review">Negotiation/Review</option>
                        <option value="Closed Won">Closed Won</option>
                        <option value="Closed Lost">Closed Lost</option>
                      </select>
                    </div>
                    <div className="crm-form-group">
                      <label className="crm-label">Probability (%)</label>
                      <input
                        type="number"
                        name="probability"
                        value={formData.probability}
                        onChange={handleFormChange}
                        className="crm-input"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleFormChange}
                        className="crm-input"
                      >
                        <option value="New Business">New Business</option>
                        <option value="Existing Business">Existing Business</option>
                        <option value="Renewal">Renewal</option>
                      </select>
                    </div>
                    <div className="crm-form-group">
                      <label className="crm-label">Lead Source</label>
                      <select
                        name="leadSource"
                        value={formData.leadSource}
                        onChange={handleFormChange}
                        className="crm-input"
                      >
                        <option value="">Select Source</option>
                        <option value="Web">Web</option>
                        <option value="Phone Inquiry">Phone Inquiry</option>
                        <option value="Partner Referral">Partner Referral</option>
                        <option value="Purchased List">Purchased List</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Next Step</label>
                      <input
                        type="text"
                        name="nextStep"
                        value={formData.nextStep}
                        onChange={handleFormChange}
                        className="crm-input"
                      />
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        className="crm-input"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="crm-modal-footer">
                  <button
                    type="button"
                    className="crm-btn crm-btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="crm-btn crm-btn-primary">
                    Update Opportunity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedOpportunity && (
          <div className="crm-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="crm-modal crm-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="crm-modal-header">
                <h3>Confirm Delete</h3>
                <button
                  className="crm-modal-close"
                  onClick={() => setShowDeleteModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="crm-modal-body">
                <p>Are you sure you want to delete the opportunity "{selectedOpportunity.opportunityName}"?</p>
                <p className="crm-text-danger">This action cannot be undone.</p>
              </div>
              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn crm-btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="crm-btn crm-btn-danger"
                  onClick={handleDeleteOpportunity}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Opportunities;

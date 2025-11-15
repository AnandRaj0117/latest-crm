import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { opportunityService } from '../services/opportunityService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import '../styles/crm.css';

const Opportunities = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    type: ''
  });

  const [formData, setFormData] = useState({
    opportunityName: '',
    amount: '',
    closeDate: '',
    stage: 'Qualification',
    probability: '50',
    type: 'New Business',
    account: '',
    description: ''
  });

  useEffect(() => {
    loadOpportunities();
  }, [pagination.page, filters]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const response = await opportunityService.getOpportunities({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      if (response?.success) {
        setOpportunities(response.data.opportunities || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await opportunityService.createOpportunity(formData);
      setSuccess('Opportunity created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadOpportunities();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create opportunity');
    }
  };

  const resetForm = () => {
    setFormData({
      opportunityName: '',
      amount: '',
      closeDate: '',
      stage: 'Qualification',
      probability: '50',
      type: 'New Business',
      account: '',
      description: ''
    });
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const canCreate = hasPermission('opportunity_management', 'create');

  return (
    <DashboardLayout title="Opportunities">
      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="crm-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input
            type="text"
            name="search"
            placeholder="Search opportunities..."
            className="crm-form-input"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select name="stage" className="crm-form-select" value={filters.stage} onChange={handleFilterChange}>
            <option value="">All Stages</option>
            <option value="Qualification">Qualification</option>
            <option value="Needs Analysis">Needs Analysis</option>
            <option value="Proposal/Price Quote">Proposal/Price Quote</option>
            <option value="Negotiation/Review">Negotiation/Review</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
          <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateModal(true)} disabled={!canCreate}>
            + New Opportunity
          </button>
        </div>
      </div>

      <div className="crm-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : opportunities.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>No opportunities found</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Opportunity Name</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Close Date</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map(opp => (
                <tr key={opp._id} onClick={() => navigate(`/opportunities/${opp._id}`)} style={{ cursor: 'pointer' }}>
                  <td>{opp.opportunityName}</td>
                  <td>{opp.account?.accountName || '-'}</td>
                  <td>₹{opp.amount?.toLocaleString() || 0}</td>
                  <td>{new Date(opp.closeDate).toLocaleDateString()}</td>
                  <td><span className="status-badge">{opp.stage}</span></td>
                  <td>{opp.probability}%</td>
                  <td>{opp.owner?.firstName} {opp.owner?.lastName}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="crm-btn crm-btn-sm crm-btn-primary" onClick={() => navigate(`/opportunities/${opp._id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Opportunity">
        <form onSubmit={handleCreate}>
          <div className="crm-form-group">
            <label>Opportunity Name *</label>
            <input type="text" name="opportunityName" className="crm-form-input" value={formData.opportunityName} onChange={handleChange} required />
          </div>
          <div className="crm-form-group">
            <label>Amount</label>
            <input type="number" name="amount" className="crm-form-input" value={formData.amount} onChange={handleChange} />
          </div>
          <div className="crm-form-group">
            <label>Close Date *</label>
            <input type="date" name="closeDate" className="crm-form-input" value={formData.closeDate} onChange={handleChange} required />
          </div>
          <div className="crm-form-group">
            <label>Stage</label>
            <select name="stage" className="crm-form-select" value={formData.stage} onChange={handleChange}>
              <option value="Qualification">Qualification</option>
              <option value="Needs Analysis">Needs Analysis</option>
              <option value="Proposal/Price Quote">Proposal/Price Quote</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Opportunities;
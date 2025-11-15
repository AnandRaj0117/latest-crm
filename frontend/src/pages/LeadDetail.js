import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { leadService } from '../services/leadService';
import { taskService } from '../services/taskService';
import { noteService } from '../services/noteService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';

import '../styles/crm.css';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const [lead, setLead] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Form data for edit
  const [formData, setFormData] = useState({});

  // Task data
  const [taskData, setTaskData] = useState({
    subject: '',
    dueDate: '',
    status: 'Not Started',
    priority: 'Normal',
    description: ''
  });

  // Note data
  const [noteData, setNoteData] = useState({
    title: '',
    content: ''
  });

  // Conversion data
  const [conversionData, setConversionData] = useState({
    createAccount: true,
    createContact: true,
    createOpportunity: false,
    accountName: '',
    opportunityName: '',
    opportunityAmount: '',
    closeDate: ''
  });

  useEffect(() => {
    loadLead();
    loadTasks();
    loadNotes();
  }, [id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await leadService.getLead(id);
      
      if (response && response.success && response.data) {
        setLead(response.data);
        // Pre-fill conversion data
        setConversionData(prev => ({
          ...prev,
          accountName: response.data.company || `${response.data.firstName} ${response.data.lastName}`,
          opportunityName: `${response.data.company || response.data.firstName + ' ' + response.data.lastName} - Opportunity`
        }));
      } else {
        setError('Failed to load lead');
      }
    } catch (err) {
      console.error('Load lead error:', err);
      setError(err.response?.data?.message || 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await taskService.getTasks({
        relatedTo: 'Lead',
        relatedToId: id,
        limit: 100
      });
      if (response?.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (err) {
      console.error('Load tasks error:', err);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await noteService.getNotes({
        relatedTo: 'Lead',
        relatedToId: id,
        limit: 100
      });
      if (response?.success) {
        setNotes(response.data.notes || []);
      }
    } catch (err) {
      console.error('Load notes error:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await taskService.createTask({
        ...taskData,
        relatedTo: 'Lead',
        relatedToId: id
      });
      setSuccess('Task created successfully!');
      setShowTaskModal(false);
      setTaskData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
      loadTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await noteService.createNote({
        ...noteData,
        relatedTo: 'Lead',
        relatedToId: id
      });
      setSuccess('Note created successfully!');
      setShowNoteModal(false);
      setNoteData({ title: '', content: '' });
      loadNotes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create note');
    }
  };

  const openEditModal = () => {
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

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await leadService.updateLead(lead._id, formData);
      setSuccess('Lead updated successfully!');
      setShowEditModal(false);
      loadLead();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update lead');
    }
  };

  const handleDeleteLead = async () => {
    try {
      setError('');
      await leadService.deleteLead(lead._id);
      setSuccess('Lead deleted successfully!');
      setTimeout(() => {
        navigate('/leads');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lead');
    }
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
        createOpportunity: conversionData.createOpportunity,
        accountData: conversionData.createAccount ? {
          accountName: conversionData.accountName,
          accountType: 'Customer',
          industry: lead.industry,
          website: lead.website,
          phone: lead.phone,
          email: lead.email,
          street: lead.street,
          city: lead.city,
          state: lead.state,
          country: lead.country,
          zipCode: lead.zipCode
        } : {},
        contactData: conversionData.createContact ? {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          jobTitle: lead.jobTitle
        } : {},
        opportunityData: conversionData.createOpportunity ? {
          opportunityName: conversionData.opportunityName,
          amount: parseFloat(conversionData.opportunityAmount),
          closeDate: conversionData.closeDate,
          stage: 'Qualification',
          probability: 50,
          type: 'New Business',
          leadSource: lead.leadSource
        } : {}
      };

      const response = await leadService.convertLead(lead._id, payload);

      if (response.success) {
        setSuccess('Lead converted successfully!');
        setShowConvertModal(false);
        
        // Redirect to account or opportunity detail page
        if (response.data.opportunity) {
          setTimeout(() => {
            navigate(`/opportunities/${response.data.opportunity._id}`);
          }, 1500);
        } else if (response.data.account) {
          setTimeout(() => {
            navigate(`/accounts/${response.data.account._id}`);
          }, 1500);
        } else {
          loadLead();
        }
      } else {
        setError(response.message || 'Failed to convert lead');
      }
    } catch (err) {
      console.error('Convert lead error:', err);
      setError(err.response?.data?.message || 'Failed to convert lead');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const canUpdateLead = hasPermission('lead_management', 'update');
  const canDeleteLead = hasPermission('lead_management', 'delete');
  const canConvertLead = hasPermission('lead_management', 'convert');

  if (loading) {
    return (
      <DashboardLayout title="Lead Details">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '10px' }}>Loading lead...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !lead) {
    return (
      <DashboardLayout title="Lead Details">
        <div style={{ padding: '20px' }}>
          <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px' }}>
            {error}
          </div>
          <button 
            className="crm-btn crm-btn-secondary" 
            onClick={() => navigate('/leads')}
            style={{ marginTop: '20px' }}
          >
            ← Back to Leads
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <DashboardLayout title="Lead Details">
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

      {/* Lead Header */}
      <div className="crm-card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}>
                  {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                </div>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
                    {lead.firstName} {lead.lastName}
                  </h1>
                  {lead.jobTitle && (
                    <p style={{ color: '#666', fontSize: '16px', margin: '4px 0' }}>
                      {lead.jobTitle} {lead.company && `at ${lead.company}`}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span className={`status-badge ${(lead.leadStatus || 'new').toLowerCase()}`}>
                      {lead.leadStatus || 'New'}
                    </span>
                    <span className={`rating-badge ${(lead.rating || 'warm').toLowerCase()}`}>
                      {lead.rating || 'Warm'}
                    </span>
                    {lead.isConverted && (
                      <span className="status-badge converted">
                        Converted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="crm-btn crm-btn-secondary"
                onClick={() => navigate('/leads')}
              >
                ← Back
              </button>
              {!lead.isConverted && canConvertLead && (
                <button 
                  className="crm-btn crm-btn-success"
                  onClick={() => setShowConvertModal(true)}
                >
                  🔄 Convert Lead
                </button>
              )}
              {canUpdateLead && (
                <button 
                  className="crm-btn crm-btn-primary"
                  onClick={openEditModal}
                >
                  ✏️ Edit
                </button>
              )}
              {canDeleteLead && (
                <button 
                  className="crm-btn crm-btn-danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Email</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                <a href={`mailto:${lead.email}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>
                  {lead.email}
                </a>
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Phone</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>
                    {lead.phone}
                  </a>
                ) : '-'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Company</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.company || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Lead Source</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.leadSource || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="crm-card">
        <div className="crm-tabs">
          <button
            className={`crm-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`crm-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
          <button
            className={`crm-tab ${activeTab === 'related' ? 'active' : ''}`}
            onClick={() => setActiveTab('related')}
          >
            Related Lists
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Lead Information</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Contact Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Full Name</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.firstName} {lead.lastName}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Email</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.email}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Phone</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Website</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                            {lead.website}
                          </a>
                        ) : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Company Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Company</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.company || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Job Title</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.jobTitle || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Industry</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.industry || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Annual Revenue</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>
                        {lead.annualRevenue ? `$${lead.annualRevenue.toLocaleString()}` : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Lead Details</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Lead Status</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.leadStatus}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Lead Source</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.leadSource}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Rating</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.rating}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Lead Score</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.leadScore || 0}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Address</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Street</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.street || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>City</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{lead.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>State / Country</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>
                        {lead.state && lead.country ? `${lead.state}, ${lead.country}` : lead.state || lead.country || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {lead.description && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Description</h4>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>{lead.description}</p>
                </div>
              )}

              {lead.isConverted && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Conversion Information</h4>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Converted Date</label>
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>
                        {lead.convertedDate ? new Date(lead.convertedDate).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    {lead.convertedTo?.account && (
                      <div>
                        <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Account</label>
                        <p style={{ fontSize: '14px', fontWeight: '500' }}>
                          <a 
                            href={`/accounts/${lead.convertedTo.account._id}`}
                            style={{ color: '#3B82F6', textDecoration: 'none' }}
                          >
                            {lead.convertedTo.account.accountName}
                          </a>
                        </p>
                      </div>
                    )}
                    {lead.convertedTo?.contact && (
                      <div>
                        <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Contact</label>
                        <p style={{ fontSize: '14px', fontWeight: '500' }}>
                          <a 
                            href={`/contacts/${lead.convertedTo.contact._id}`}
                            style={{ color: '#3B82F6', textDecoration: 'none' }}
                          >
                            {lead.convertedTo.contact.firstName} {lead.convertedTo.contact.lastName}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Activity Timeline</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <p>Timeline feature coming soon...</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>This will show all activities, notes, and changes related to this lead.</p>
              </div>
            </div>
          )}

          {/* Related Lists Tab */}
          {activeTab === 'related' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Related Lists</h3>
              
              {/* Open Activities */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Open Activities</h4>
                  <button 
                    className="crm-btn crm-btn-sm crm-btn-primary"
                    onClick={() => setShowTaskModal(true)}
                  >
                    + New Task
                  </button>
                </div>
                {tasks.length === 0 ? (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#666' }}>
                    <p>No open activities found</p>
                  </div>
                ) : (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                    <table className="crm-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Due Date</th>
                          <th>Status</th>
                          <th>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map(task => (
                          <tr key={task._id}>
                            <td>{task.subject}</td>
                            <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                            <td><span className="status-badge">{task.status}</span></td>
                            <td><span className="rating-badge">{task.priority}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Notes</h4>
                  <button 
                    className="crm-btn crm-btn-sm crm-btn-primary"
                    onClick={() => setShowNoteModal(true)}
                  >
                    + New Note
                  </button>
                </div>
                {notes.length === 0 ? (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#666' }}>
                    <p>No notes found</p>
                  </div>
                ) : (
                  <div>
                    {notes.map(note => (
                      <div key={note._id} style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>{note.title}</div>
                        <div style={{ color: '#666', fontSize: '14px' }}>{note.content}</div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                          {new Date(note.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Attachments</h4>
                  <button className="crm-btn crm-btn-sm crm-btn-primary">+ Attach File</button>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#666' }}>
                  <p>No attachments found</p>
                </div>
              </div>

              {/* Emails */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Emails</h4>
                  <button className="crm-btn crm-btn-sm crm-btn-primary">+ Compose Email</button>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#666' }}>
                  <p>No emails found</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Create Task">
        <form onSubmit={handleCreateTask}>
          <div className="crm-form-group">
            <label>Subject *</label>
            <input
              type="text"
              className="crm-form-input"
              value={taskData.subject}
              onChange={(e) => setTaskData({ ...taskData, subject: e.target.value })}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Due Date *</label>
            <input
              type="date"
              className="crm-form-input"
              value={taskData.dueDate}
              onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Priority</label>
            <select
              className="crm-form-select"
              value={taskData.priority}
              onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
            >
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="crm-form-group">
            <label>Description</label>
            <textarea
              className="crm-form-textarea"
              rows="3"
              value={taskData.description}
              onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowTaskModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>

      {/* Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Create Note">
        <form onSubmit={handleCreateNote}>
          <div className="crm-form-group">
            <label>Title *</label>
            <input
              type="text"
              className="crm-form-input"
              value={noteData.title}
              onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Content *</label>
            <textarea
              className="crm-form-textarea"
              rows="5"
              value={noteData.content}
              onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowNoteModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Create Note</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setError('');
        }}
        title="Edit Lead"
        size="large"
      >
        <form onSubmit={handleUpdateLead}>
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
        onClose={() => setShowDeleteModal(false)}
        title="Delete Lead"
        size="small"
      >
        <div>
          <p>Are you sure you want to delete this lead?</p>
          <p style={{ marginTop: '10px', fontWeight: '600' }}>
            {lead.firstName} {lead.lastName}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {lead.company} • {lead.email}
          </p>
          <p style={{ marginTop: '15px', color: '#E74C3C', fontSize: '14px' }}>
            This action cannot be undone.
          </p>

          <div className="modal-footer">
            <button
              className="crm-btn crm-btn-secondary"
              onClick={() => setShowDeleteModal(false)}
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

      {/* Convert Lead Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Convert Lead"
        size="large"
      >
        <form onSubmit={handleConvertLead}>
          {/* Lead Info */}
          <div className="crm-card" style={{ marginBottom: '20px', background: '#f8f9fa' }}>
            <div className="crm-card-body">
              <h4 style={{ marginBottom: '10px' }}>Lead Information</h4>
              <p><strong>Name:</strong> {lead.firstName} {lead.lastName}</p>
              <p><strong>Email:</strong> {lead.email}</p>
              <p><strong>Company:</strong> {lead.company || 'N/A'}</p>
              <p><strong>Phone:</strong> {lead.phone || 'N/A'}</p>
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

          <div className="modal-footer">
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
      </Modal>
    </DashboardLayout>
  );
};

export default LeadDetail;
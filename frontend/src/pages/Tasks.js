import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { taskService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import '../styles/crm.css';

const Tasks = () => {
  const { hasPermission } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    dueDate: '',
    status: 'Not Started',
    priority: 'Normal',
    description: ''
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks({
        page: 1,
        limit: 100
      });
      console.log('Tasks response:', response);
      if (response?.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (err) {
      console.error('Load tasks error:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask({
        ...formData,
        relatedTo: 'Lead',
        relatedToId: '000000000000000000000000' // Dummy ID
      });
      setSuccess('Task created!');
      setShowCreateModal(false);
      setFormData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
      loadTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create task');
    }
  };

  return (
    <DashboardLayout 
      title="Tasks" 
      actionButton={
        <button className="crm-btn crm-btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Task
        </button>
      }
    >
      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="crm-card">
        <div className="crm-card-header">
          <h2>All Tasks ({tasks.length})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>No tasks found</div>
        ) : (
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
        )}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Task">
        <form onSubmit={handleCreate}>
          <div className="crm-form-group">
            <label>Subject *</label>
            <input
              type="text"
              className="crm-form-input"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Due Date *</label>
            <input
              type="date"
              className="crm-form-input"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              required
            />
          </div>
          <div className="crm-form-group">
            <label>Priority</label>
            <select 
              className="crm-form-select" 
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
            >
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Tasks;
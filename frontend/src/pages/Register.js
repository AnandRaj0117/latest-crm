import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { registerTenant } = useAuth();
  const [formData, setFormData] = useState({
    organizationName: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from organization name
    if (name === 'organizationName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      await registerTenant(registrationData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-large">
        <h1 className="auth-title">Create Your Organization</h1>
        <p className="auth-subtitle">Get started with your free trial</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Organization Details</h3>

            <div className="form-group">
              <label className="form-label">Organization Name *</label>
              <input
                type="text"
                name="organizationName"
                className="form-input"
                placeholder="Enter organization name"
                value={formData.organizationName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organization Slug *</label>
              <input
                type="text"
                name="slug"
                className="form-input"
                placeholder="organization-slug"
                value={formData.slug}
                onChange={handleChange}
                required
              />
              <small className="form-hint">Used in your organization's URL</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Email *</label>
                <input
                  type="email"
                  name="contactEmail"
                  className="form-input"
                  placeholder="contact@company.com"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  className="form-input"
                  placeholder="+1 234 567 8900"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Admin Account</h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="adminFirstName"
                  className="form-input"
                  placeholder="John"
                  value={formData.adminFirstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="adminLastName"
                  className="form-input"
                  placeholder="Doe"
                  value={formData.adminLastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Email *</label>
              <input
                type="email"
                name="adminEmail"
                className="form-input"
                placeholder="admin@company.com"
                value={formData.adminEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  name="adminPassword"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

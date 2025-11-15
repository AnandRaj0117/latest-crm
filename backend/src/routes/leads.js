const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  bulkUploadLeads,
  getLeadStats
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes are protected
router.use(protect);

// Lead statistics
router.get('/stats', requirePermission('lead_management', 'read'), getLeadStats);

// Bulk upload
router.post('/bulk-upload', requirePermission('lead_management', 'import'), bulkUploadLeads);

// Lead conversion
router.post('/:id/convert', requirePermission('lead_management', 'convert'), convertLead);

// CRUD routes
router.get('/', requirePermission('lead_management', 'read'), getLeads);
router.get('/:id', requirePermission('lead_management', 'read'), getLead);
router.post('/', requirePermission('lead_management', 'create'), createLead);
router.put('/:id', requirePermission('lead_management', 'update'), updateLead);
router.delete('/:id', requirePermission('lead_management', 'delete'), deleteLead);

module.exports = router;

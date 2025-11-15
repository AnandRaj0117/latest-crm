const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  bulkImportLeads
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// Bulk import route (must be before /:id route)
router.post('/bulk-import', requirePermission('lead_management', 'import'), bulkImportLeads);

// Convert lead route (must be before /:id route)
router.post('/:id/convert', requirePermission('lead_management', 'convert'), convertLead);

// CRUD routes
router.route('/')
  .get(requirePermission('lead_management', 'read'), getLeads)
  .post(requirePermission('lead_management', 'create'), createLead);

router.route('/:id')
  .get(requirePermission('lead_management', 'read'), getLead)
  .put(requirePermission('lead_management', 'update'), updateLead)
  .delete(requirePermission('lead_management', 'delete'), deleteLead);

module.exports = router;
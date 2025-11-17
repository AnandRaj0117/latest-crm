const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  bulkImportLeads,
  bulkUploadLeads,
  downloadSampleTemplate
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `leads-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls' && ext !== '.csv') {
      return cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes require authentication
router.use(protect);

// Bulk upload routes (must be before /:id routes)
router.post('/bulk-upload', 
  requirePermission('lead_management', 'import'), 
  upload.single('file'), 
  bulkUploadLeads
);

router.get('/download-template', 
  requirePermission('lead_management', 'import'), 
  downloadSampleTemplate
);

// Bulk import route (JSON)
router.post('/bulk-import', 
  requirePermission('lead_management', 'import'), 
  bulkImportLeads
);

// Convert lead route
router.post('/:id/convert', 
  requirePermission('lead_management', 'convert'), 
  convertLead
);

// CRUD routes
router.route('/')
  .get(requirePermission('lead_management', 'read'), getLeads)
  .post(requirePermission('lead_management', 'create'), createLead);

router.route('/:id')
  .get(requirePermission('lead_management', 'read'), getLead)
  .put(requirePermission('lead_management', 'update'), updateLead)
  .delete(requirePermission('lead_management', 'delete'), deleteLead);

module.exports = router;
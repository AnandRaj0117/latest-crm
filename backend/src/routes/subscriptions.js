const express = require('express');
const router = express.Router();
const {
  getSubscriptions,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  renewSubscription
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getSubscriptions);
router.get('/:id', getSubscription);
router.put('/:id', updateSubscription);
router.post('/:id/cancel', cancelSubscription);
router.post('/:id/renew', renewSubscription);

module.exports = router;

const express = require('express');
const glucoseController = require('../controllers/glucose.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protect all routes in this router
router.use(protect);

router
  .route('/')
  .get(glucoseController.getGlucoseRecords)
  .post(glucoseController.createGlucoseRecord);

router
  .route('/:id')
  .get(glucoseController.getGlucoseRecord)
  .put(glucoseController.updateGlucoseRecord)
  .delete(glucoseController.deleteGlucoseRecord);

module.exports = router;

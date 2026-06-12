const express = require('express');
const bodyCompositionController = require('../controllers/bodyComposition.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(bodyCompositionController.getBodyCompRecords)
  .post(bodyCompositionController.createBodyCompRecord);

router.get('/dashboard', bodyCompositionController.getBodyCompDashboard);

router
  .route('/:id')
  .get(bodyCompositionController.getBodyCompRecord)
  .put(bodyCompositionController.updateBodyCompRecord)
  .delete(bodyCompositionController.deleteBodyCompRecord);

module.exports = router;

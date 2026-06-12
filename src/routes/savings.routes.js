const express = require('express');
const savingsController = require('../controllers/savings.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

// Dashboard data
router.get('/dashboard', savingsController.getSavingsDashboard);

// Savings Objectives routes
router
  .route('/objectives')
  .get(savingsController.getObjectives)
  .post(savingsController.createObjective);

router
  .route('/objectives/:id')
  .get(savingsController.getObjective)
  .put(savingsController.updateObjective)
  .delete(savingsController.deleteObjective);

// Savings Transactions routes
router
  .route('/transactions')
  .get(savingsController.getTransactions)
  .post(savingsController.createTransaction);

router
  .route('/transactions/:id')
  .get(savingsController.getTransaction)
  .put(savingsController.updateTransaction)
  .delete(savingsController.deleteTransaction);

module.exports = router;

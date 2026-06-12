const savingsService = require('../services/savings.service');

const getSavingsDashboard = async (req, res, next) => {
  try {
    const dashboard = await savingsService.getSavingsDashboard(req.user._id);
    res.status(200).json({
      status: 'success',
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// --- OBJECTIVES CONTROLLERS ---
const createObjective = async (req, res, next) => {
  try {
    const objective = await savingsService.createObjective(req.user._id, req.body);
    res.status(201).json({
      status: 'success',
      data: {
        objective,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getObjectives = async (req, res, next) => {
  try {
    const objectives = await savingsService.getObjectives(req.user._id);
    res.status(200).json({
      status: 'success',
      results: objectives.length,
      data: {
        objectives,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getObjective = async (req, res, next) => {
  try {
    const objective = await savingsService.getObjectiveById(req.user._id, req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        objective,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateObjective = async (req, res, next) => {
  try {
    const objective = await savingsService.updateObjective(req.user._id, req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: {
        objective,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteObjective = async (req, res, next) => {
  try {
    await savingsService.deleteObjective(req.user._id, req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// --- TRANSACTIONS CONTROLLERS ---
const createTransaction = async (req, res, next) => {
  try {
    const transaction = await savingsService.createTransaction(req.user._id, req.body);
    res.status(201).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await savingsService.getTransactions(req.user._id);
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTransaction = async (req, res, next) => {
  try {
    const transaction = await savingsService.getTransactionById(req.user._id, req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await savingsService.updateTransaction(req.user._id, req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    await savingsService.deleteTransaction(req.user._id, req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSavingsDashboard,
  createObjective,
  getObjectives,
  getObjective,
  updateObjective,
  deleteObjective,
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
};

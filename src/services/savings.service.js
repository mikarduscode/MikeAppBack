const SavingsObjective = require('../models/SavingsObjective');
const SavingsTransaction = require('../models/SavingsTransaction');
const AppError = require('../utils/appError');

// --- OBJECTIVES SERVICES ---
const createObjective = async (userId, data) => {
  return await SavingsObjective.create({
    ...data,
    user: userId,
  });
};

const getObjectives = async (userId) => {
  const objectives = await SavingsObjective.find({ user: userId });
  
  // Augment objectives with their accumulated amounts
  const augmentedObjectives = await Promise.all(
    objectives.map(async (obj) => {
      const transactions = await SavingsTransaction.find({
        user: userId,
        'distributions.objective': obj._id,
      });

      const accumulated = transactions.reduce((sum, tx) => {
        const dist = tx.distributions.find((d) => String(d.objective) === String(obj._id));
        return sum + (dist ? dist.amount : 0);
      }, 0);

      const remaining = Math.max(0, obj.targetAmount - accumulated);
      const progress = obj.targetAmount > 0 ? Math.round((accumulated / obj.targetAmount) * 10000) / 100 : 0;

      // Get contribution history for this individual objective
      const history = transactions.map((tx) => {
        const dist = tx.distributions.find((d) => String(d.objective) === String(obj._id));
        return {
          _id: tx._id,
          amount: dist ? dist.amount : 0,
          date: tx.date,
          notes: tx.notes,
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        ...obj.toObject(),
        accumulated,
        remaining,
        progress,
        history,
      };
    })
  );

  return augmentedObjectives;
};

const getObjectiveById = async (userId, objId) => {
  const obj = await SavingsObjective.findOne({ _id: objId, user: userId });
  if (!obj) {
    throw new AppError('Savings objective not found.', 404);
  }

  // Compute accumulated
  const transactions = await SavingsTransaction.find({
    user: userId,
    'distributions.objective': obj._id,
  });

  const accumulated = transactions.reduce((sum, tx) => {
    const dist = tx.distributions.find((d) => String(d.objective) === String(obj._id));
    return sum + (dist ? dist.amount : 0);
  }, 0);

  const remaining = Math.max(0, obj.targetAmount - accumulated);
  const progress = obj.targetAmount > 0 ? Math.round((accumulated / obj.targetAmount) * 10000) / 100 : 0;

  const history = transactions.map((tx) => {
    const dist = tx.distributions.find((d) => String(d.objective) === String(obj._id));
    return {
      _id: tx._id,
      amount: dist ? dist.amount : 0,
      date: tx.date,
      notes: tx.notes,
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    ...obj.toObject(),
    accumulated,
    remaining,
    progress,
    history,
  };
};

const updateObjective = async (userId, objId, data) => {
  const obj = await SavingsObjective.findOneAndUpdate(
    { _id: objId, user: userId },
    data,
    { new: true, runValidators: true }
  );

  if (!obj) {
    throw new AppError('Savings objective not found.', 404);
  }

  return await getObjectiveById(userId, obj._id);
};

const deleteObjective = async (userId, objId) => {
  const obj = await SavingsObjective.findOneAndDelete({ _id: objId, user: userId });
  if (!obj) {
    throw new AppError('Savings objective not found.', 404);
  }

  // Pull references or clean up transactions distributions
  await SavingsTransaction.updateMany(
    { user: userId, 'distributions.objective': objId },
    { $pull: { distributions: { objective: objId } } }
  );

  // Clean up transactions with empty distributions or adjust amounts
  // In a real application, you might want to mark them or handle remaining as unallocated
  return obj;
};

// --- TRANSACTIONS SERVICES ---
const createTransaction = async (userId, data) => {
  // Validate distribution sum matches total amount
  const distSum = (data.distributions || []).reduce((sum, curr) => sum + Number(curr.amount), 0);
  if (Math.abs(distSum - Number(data.amount)) > 0.01) {
    throw new AppError('La suma de las asignaciones debe coincidir exactamente con el monto total registrado.', 400);
  }

  return await SavingsTransaction.create({
    ...data,
    user: userId,
  });
};

const getTransactions = async (userId) => {
  return await SavingsTransaction.find({ user: userId })
    .populate('distributions.objective', 'name')
    .sort({ date: -1 });
};

const getTransactionById = async (userId, txId) => {
  const tx = await SavingsTransaction.findOne({ _id: txId, user: userId }).populate('distributions.objective', 'name');
  if (!tx) {
    throw new AppError('Savings transaction not found.', 404);
  }
  return tx;
};

const updateTransaction = async (userId, txId, data) => {
  if (data.amount !== undefined || data.distributions !== undefined) {
    const amount = data.amount !== undefined ? Number(data.amount) : (await getTransactionById(userId, txId)).amount;
    const distributions = data.distributions || (await getTransactionById(userId, txId)).distributions;
    
    const distSum = distributions.reduce((sum, curr) => sum + Number(curr.amount), 0);
    if (Math.abs(distSum - amount) > 0.01) {
      throw new AppError('La suma de las asignaciones debe coincidir exactamente con el monto total registrado.', 400);
    }
  }

  const tx = await SavingsTransaction.findOneAndUpdate(
    { _id: txId, user: userId },
    data,
    { new: true, runValidators: true }
  ).populate('distributions.objective', 'name');

  if (!tx) {
    throw new AppError('Savings transaction not found.', 404);
  }
  return tx;
};

const deleteTransaction = async (userId, txId) => {
  const tx = await SavingsTransaction.findOneAndDelete({ _id: txId, user: userId });
  if (!tx) {
    throw new AppError('Savings transaction not found.', 404);
  }
  return tx;
};

// --- DASHBOARD SERVICES ---
const getSavingsDashboard = async (userId) => {
  const objectives = await getObjectives(userId);
  const transactions = await SavingsTransaction.find({ user: userId })
    .populate('distributions.objective', 'name')
    .sort({ date: -1 });

  // 1. Total Ahorrado
  const totalSaved = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // 2. Active vs Completed objectives count
  const activeObjectives = objectives.filter(o => o.status === 'in_progress' || o.status === 'paused');
  const completedObjectives = objectives.filter(o => o.status === 'completed');

  const activeCount = activeObjectives.length;
  const completedCount = completedObjectives.length;

  // 3. Total Comprometido (assigned to active/completed objectives)
  // Since all transactions require 100% distribution in our rules, committed equals totalSaved
  // But let's calculate it by summing active/completed objectives accumulated amounts to be mathematically accurate.
  const totalCommitted = objectives
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.accumulated, 0);

  // 4. Total Pendiente (remaining to complete active goals)
  const totalPending = activeObjectives.reduce((sum, o) => sum + o.remaining, 0);

  // 5. Global Progress
  const globalTarget = activeObjectives.reduce((sum, o) => sum + o.targetAmount, 0);
  const globalAccumulated = activeObjectives.reduce((sum, o) => sum + o.accumulated, 0);
  const globalProgress = globalTarget > 0 ? Math.round((globalAccumulated / globalTarget) * 10000) / 100 : 0;

  // 6. Monthly Trend Chart Data
  // Group transactions by month/year and compute accumulated savings
  const monthlyMap = new Map();
  // Sort transactions by date ascending for trend
  const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let cumulative = 0;
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  sortedTxs.forEach((tx) => {
    const d = new Date(tx.date);
    const key = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
    
    cumulative += tx.amount;
    // We overwrite so we get the cumulative value at the end of the month
    monthlyMap.set(key, cumulative);
  });

  const monthlyTrend = Array.from(monthlyMap.entries()).map(([name, amount]) => ({
    name,
    Ahorro: amount,
  }));

  return {
    totalSaved,
    totalCommitted,
    totalPending,
    activeCount,
    completedCount,
    globalProgress,
    objectives,
    transactions,
    monthlyTrend,
  };
};

module.exports = {
  createObjective,
  getObjectives,
  getObjectiveById,
  updateObjective,
  deleteObjective,
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSavingsDashboard,
};

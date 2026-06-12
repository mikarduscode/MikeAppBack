const mongoose = require('mongoose');

const savingsObjectiveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Savings objective must belong to a user.'],
    },
    name: {
      type: String,
      required: [true, 'Please provide the objective name.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, 'Please provide the target savings amount.'],
      min: [1, 'Target amount must be greater than 0.'],
    },
    targetDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'paused', 'cancelled'],
      default: 'in_progress',
    },
  },
  {
    timestamps: true,
  }
);

const SavingsObjective = mongoose.model('SavingsObjective', savingsObjectiveSchema);

module.exports = SavingsObjective;

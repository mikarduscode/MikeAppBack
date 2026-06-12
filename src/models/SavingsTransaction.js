const mongoose = require('mongoose');

const savingsTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Savings transaction must belong to a user.'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide the transaction amount.'],
      min: [0.01, 'Amount must be greater than 0.'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide the date.'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    distributions: [
      {
        objective: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SavingsObjective',
          required: [true, 'Objective reference is required.'],
        },
        amount: {
          type: Number,
          required: [true, 'Distribution amount is required.'],
          min: [0.01, 'Distribution amount must be greater than 0.'],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SavingsTransaction = mongoose.model('SavingsTransaction', savingsTransactionSchema);

module.exports = SavingsTransaction;

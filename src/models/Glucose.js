const mongoose = require('mongoose');

const glucoseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Glucose record must belong to a user.'],
    },
    value: {
      type: Number,
      required: [true, 'Please provide the glucose level value.'],
    },
    unit: {
      type: String,
      enum: ['mg/dL', 'mmol/L'],
      default: 'mg/dL',
    },
    date: {
      type: Date,
      required: [true, 'Please provide the date.'],
      default: Date.now,
    },
    time: {
      type: String,
      required: [true, 'Please provide the time.'],
    },
    phase: {
      type: String,
      enum: ['Ayunas', 'Antes de comer', 'Después de comer', 'Antes de dormir', 'Otro'],
      required: [true, 'Please select the phase of the day.'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Glucose = mongoose.model('Glucose', glucoseSchema);

module.exports = Glucose;

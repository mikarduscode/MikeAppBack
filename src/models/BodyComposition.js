const mongoose = require('mongoose');

const bodyCompositionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Body composition record must belong to a user.'],
    },
    type: {
      type: String,
      enum: ['weekly', 'nutritionist'],
      required: [true, 'Please provide the type of record (weekly or nutritionist).'],
    },
    weight: {
      type: Number,
      required: [true, 'Please provide weight in kg.'],
    },
    height: {
      type: Number,
      required: [true, 'Please provide height in cm.'],
    },
    weightGoal: {
      type: Number,
      required: [true, 'Please provide weight goal in kg.'],
    },
    waist: {
      type: Number,
    },
    neck: {
      type: Number,
    },
    hip: {
      type: Number,
    },
    date: {
      type: Date,
      required: [true, 'Please provide the record date.'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    // Advanced / Smart Scale / Nutritionist fields (all optional in schema for flexibility)
    fatPercentage: {
      type: Number,
    },
    muscleMass: {
      type: Number,
    },
    fatFreeMass: {
      type: Number,
    },
    visceralFat: {
      type: Number,
    },
    waterPercentage: {
      type: Number,
    },
    boneMass: {
      type: Number,
    },
    metabolicAge: {
      type: Number,
    },
    restingHeartRate: {
      type: Number,
    },
    bmi: {
      type: Number,
    },
    foodPlan: {
      type: String,
      trim: true,
    },
    recommendations: {
      type: String,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

const BodyComposition = mongoose.model('BodyComposition', bodyCompositionSchema);

module.exports = BodyComposition;

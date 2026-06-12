const Glucose = require('../models/Glucose');
const AppError = require('../utils/appError');

const createRecord = async (userId, data) => {
  return await Glucose.create({
    ...data,
    user: userId,
  });
};

const getRecords = async (userId) => {
  return await Glucose.find({ user: userId }).sort({ date: -1, time: -1 });
};

const getRecordById = async (userId, recordId) => {
  const record = await Glucose.findOne({ _id: recordId, user: userId });
  if (!record) {
    throw new AppError('Glucose record not found.', 404);
  }
  return record;
};

const updateRecord = async (userId, recordId, data) => {
  const record = await Glucose.findOneAndUpdate(
    { _id: recordId, user: userId },
    data,
    { new: true, runValidators: true }
  );

  if (!record) {
    throw new AppError('Glucose record not found.', 404);
  }
  return record;
};

const deleteRecord = async (userId, recordId) => {
  const record = await Glucose.findOneAndDelete({ _id: recordId, user: userId });
  if (!record) {
    throw new AppError('Glucose record not found.', 404);
  }
  return record;
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};

const glucoseService = require('../services/glucose.service');

const createGlucoseRecord = async (req, res, next) => {
  try {
    const record = await glucoseService.createRecord(req.user._id, req.body);
    res.status(201).json({
      status: 'success',
      data: {
        record,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getGlucoseRecords = async (req, res, next) => {
  try {
    const records = await glucoseService.getRecords(req.user._id);
    res.status(200).json({
      status: 'success',
      results: records.length,
      data: {
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getGlucoseRecord = async (req, res, next) => {
  try {
    const record = await glucoseService.getRecordById(req.user._id, req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        record,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateGlucoseRecord = async (req, res, next) => {
  try {
    const record = await glucoseService.updateRecord(req.user._id, req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: {
        record,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteGlucoseRecord = async (req, res, next) => {
  try {
    await glucoseService.deleteRecord(req.user._id, req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGlucoseRecord,
  getGlucoseRecords,
  getGlucoseRecord,
  updateGlucoseRecord,
  deleteGlucoseRecord,
};

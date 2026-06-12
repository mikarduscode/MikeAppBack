const bodyCompositionService = require('../services/bodyComposition.service');

const createBodyCompRecord = async (req, res, next) => {
  try {
    const record = await bodyCompositionService.createRecord(req.user._id, req.body);
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

const getBodyCompRecords = async (req, res, next) => {
  try {
    const { type } = req.query; // Filter by type ('weekly' or 'nutritionist') if provided
    const records = await bodyCompositionService.getRecords(req.user, type);
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

const getBodyCompRecord = async (req, res, next) => {
  try {
    const record = await bodyCompositionService.getRecordById(req.user._id, req.params.id);
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

const updateBodyCompRecord = async (req, res, next) => {
  try {
    const record = await bodyCompositionService.updateRecord(req.user._id, req.params.id, req.body);
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

const deleteBodyCompRecord = async (req, res, next) => {
  try {
    await bodyCompositionService.deleteRecord(req.user._id, req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getBodyCompDashboard = async (req, res, next) => {
  try {
    const dashboard = await bodyCompositionService.getDashboard(req.user);
    res.status(200).json({
      status: 'success',
      data: {
        dashboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBodyCompRecord,
  getBodyCompRecords,
  getBodyCompRecord,
  updateBodyCompRecord,
  deleteBodyCompRecord,
  getBodyCompDashboard,
};

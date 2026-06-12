const BodyComposition = require('../models/BodyComposition');
const AppError = require('../utils/appError');
const helper = require('../utils/bodyComposition.helper');

const enrichRecords = (records, user) => {
  if (!records || records.length === 0) return [];
  
  return records.map(r => {
    const doc = r.toObject ? r.toObject() : { ...r };
    
    // Calculate chronological age at the time of the record
    let ageAtRecord = null;
    if (user.birthDate) {
      const recordDate = new Date(doc.date);
      const birth = new Date(user.birthDate);
      ageAtRecord = recordDate.getFullYear() - birth.getFullYear();
      const monthDiff = recordDate.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && recordDate.getDate() < birth.getDate())) {
        ageAtRecord--;
      }
    }
    
    // Calculate BMI
    if (doc.weight && doc.height) {
      doc.bmi = Math.round((doc.weight / ((doc.height / 100) ** 2)) * 10) / 10;
    }

    // Calculate WHtR
    if (doc.waist && doc.height) {
      const whtrInfo = helper.calculateWHtR(doc.waist, doc.height, user.gender);
      doc.whtr = whtrInfo.value;
      doc.whtrRisk = whtrInfo.risk;
      doc.metabolicRisk = helper.estimateMetabolicRisk(doc.waist, doc.height, user.gender);
    }

    // Calculate Navy Body Fat Estimate
    if (!doc.fatPercentage && doc.waist && doc.neck && doc.height) {
      const navy = helper.calculateBodyFatNavy(doc.waist, doc.neck, doc.height, doc.hip, user.gender);
      if (navy) {
        doc.estimatedFat = navy.value;
        doc.fatSource = 'estimated';
        doc.fatCategory = navy.category;
      }
    } else if (doc.fatPercentage) {
      doc.fatSource = 'measured';
    }

    // Calculate TMB and TDEE
    if (ageAtRecord && doc.weight && doc.height) {
      doc.bmr = helper.calculateBMR(doc.weight, doc.height, ageAtRecord, user.gender);
      if (doc.bmr) {
        const tdeeInfo = helper.calculateTDEECalories(doc.bmr, user.activityLevel);
        doc.tdee = tdeeInfo.tdee;
        doc.deficits = tdeeInfo.deficits;
      }
    }
    
    // Calculate metabolic age
    if (ageAtRecord) {
      // Prefer measured fat percentage if available, otherwise Navy estimate
      let activeFat = doc.fatPercentage || doc.estimatedFat;
      doc.metabolicAge = helper.calculateMetabolicAge(ageAtRecord, doc.bmi, activeFat, user.gender);
    }
    
    return doc;
  });
};

const createRecord = async (userId, data) => {
  let bmiVal = data.bmi;
  if (data.weight && data.height && !bmiVal) {
    bmiVal = Math.round((data.weight / ((data.height / 100) ** 2)) * 10) / 10;
  }
  return await BodyComposition.create({
    ...data,
    bmi: bmiVal,
    user: userId,
  });
};

const getRecords = async (user, type) => {
  const query = { user: user._id };
  if (type) {
    query.type = type;
  }
  const records = await BodyComposition.find(query).sort({ date: -1 });
  return enrichRecords(records, user);
};

const getRecordById = async (userId, recordId) => {
  const record = await BodyComposition.findOne({ _id: recordId, user: userId });
  if (!record) {
    throw new AppError('Body composition record not found.', 404);
  }
  return record;
};

const updateRecord = async (userId, recordId, data) => {
  let bmiVal = data.bmi;
  if (data.weight && data.height && !bmiVal) {
    bmiVal = Math.round((data.weight / ((data.height / 100) ** 2)) * 10) / 10;
  }
  const record = await BodyComposition.findOneAndUpdate(
    { _id: recordId, user: userId },
    { ...data, bmi: bmiVal },
    { new: true, runValidators: true }
  );

  if (!record) {
    throw new AppError('Body composition record not found.', 404);
  }
  return record;
};

const deleteRecord = async (userId, recordId) => {
  const record = await BodyComposition.findOneAndDelete({ _id: recordId, user: userId });
  if (!record) {
    throw new AppError('Body composition record not found.', 404);
  }
  return record;
};

/**
 * Get aggregated dashboard statistics, trends, metabolic health indicators and caloric targets
 * @param {Object} user - Authenticated user document
 */
const getDashboard = async (user) => {
  const rawRecords = await BodyComposition.find({ user: user._id }).sort({ date: -1 });
  const records = enrichRecords(rawRecords, user);
  
  if (records.length === 0) {
    return {
      hasData: false,
      message: 'Aún no has registrado ningún dato de composición corporal.',
      userProfile: {
        gender: user.gender,
        birthDate: user.birthDate,
        activityLevel: user.activityLevel,
        hasProfile: !!(user.gender && user.birthDate && user.activityLevel)
      }
    };
  }

  const latest = records[0];
  
  // Find previous record for weekly changes (ideal is ~7 days ago, default to records[1])
  let prevWeekly = null;
  if (records.length > 1) {
    const latestDate = new Date(latest.date);
    prevWeekly = records.find(r => {
      const diffDays = Math.abs(latestDate - new Date(r.date)) / (1000 * 60 * 60 * 24);
      return diffDays >= 5 && diffDays <= 9; // 5 to 9 days window
    });
    if (!prevWeekly) {
      prevWeekly = records[1];
    }
  }

  // Find record closest to 30 days ago for monthly trends
  let prevMonthly = null;
  if (records.length > 1) {
    const latestDate = new Date(latest.date);
    prevMonthly = records.find(r => {
      const diffDays = Math.abs(latestDate - new Date(r.date)) / (1000 * 60 * 60 * 24);
      return diffDays >= 25 && diffDays <= 35; // 25 to 35 days window
    });
    if (!prevMonthly) {
      // Fallback to the oldest record that is at least 14 days old, or just the oldest record
      const oldRecords = records.filter(r => (latestDate - new Date(r.date)) / (1000 * 60 * 60 * 24) >= 14);
      prevMonthly = oldRecords[oldRecords.length - 1] || records[records.length - 1];
    }
  }

  // Basic anthropometrics
  const bmiInfo = helper.calculateBMI(latest.weight, latest.height);
  const whtrInfo = helper.calculateWHtR(latest.waist, latest.height, user.gender);
  const wnrInfo = latest.waist && latest.neck ? {
    value: Math.round((latest.waist / latest.neck) * 100) / 100,
    label: 'Relación Cintura-Cuello'
  } : null;

  // Metabolic health risk
  const metabolicRisk = helper.estimateMetabolicRisk(latest.waist, latest.height, user.gender);

  // Navy Body Fat
  const navyFat = helper.calculateBodyFatNavy(latest.waist, latest.neck, latest.height, latest.hip, user.gender);
  
  // Decide what fat percentage to display (prefer nutritionist measured value, fall back to Navy estimate)
  const measuredFat = latest.fatPercentage;
  const estimatedFat = navyFat ? navyFat.value : null;
  const activeFatPercentage = measuredFat || estimatedFat;
  const fatSource = measuredFat ? 'measured' : (estimatedFat ? 'estimated' : null);
  const fatCategory = measuredFat ? 
    (helper.calculateBodyFatNavy(latest.waist || 90, latest.neck || 38, latest.height, latest.hip, user.gender)?.category || 'Promedio') : 
    (navyFat ? navyFat.category : 'N/A');

  // Caloric calculations (if user details exist)
  const age = helper.calculateAge(user.birthDate);
  const bmr = helper.calculateBMR(latest.weight, latest.height, age, user.gender);
  const caloricProfile = bmr ? helper.calculateTDEECalories(bmr, user.activityLevel) : null;

  // Weekly changes
  const weeklyChange = prevWeekly ? {
    weight: Math.round((latest.weight - prevWeekly.weight) * 10) / 10,
    waist: latest.waist && prevWeekly.waist ? Math.round((latest.waist - prevWeekly.waist) * 10) / 10 : null,
    neck: latest.neck && prevWeekly.neck ? Math.round((latest.neck - prevWeekly.neck) * 10) / 10 : null,
    fatPercentage: latest.fatPercentage && prevWeekly.fatPercentage ? Math.round((latest.fatPercentage - prevWeekly.fatPercentage) * 10) / 10 : null,
    muscleMass: latest.muscleMass && prevWeekly.muscleMass ? Math.round((latest.muscleMass - prevWeekly.muscleMass) * 10) / 10 : null,
    dateRange: `${new Date(prevWeekly.date).toLocaleDateString('es-ES')} a ${new Date(latest.date).toLocaleDateString('es-ES')}`
  } : null;

  // Monthly trends & projections
  let monthlyChangeRate = 0; // kg per week
  let projection30 = null;
  let projection60 = null;
  let projection90 = null;

  if (prevMonthly && prevMonthly._id.toString() !== latest._id.toString()) {
    const daysDiff = (new Date(latest.date) - new Date(prevMonthly.date)) / (1000 * 60 * 60 * 24);
    if (daysDiff > 3) {
      const weightDiff = latest.weight - prevMonthly.weight;
      monthlyChangeRate = Math.round(((weightDiff / daysDiff) * 7) * 10) / 10;
      
      projection30 = Math.round((latest.weight + (monthlyChangeRate * 30 / 7)) * 10) / 10;
      projection60 = Math.round((latest.weight + (monthlyChangeRate * 60 / 7)) * 10) / 10;
      projection90 = Math.round((latest.weight + (monthlyChangeRate * 90 / 7)) * 10) / 10;
    }
  }

  // Recomposition analysis
  // Compare latest with the oldest record in the last 15-30 days, or fallback to the oldest record
  const compareRecord = prevMonthly || prevWeekly;
  const recomposition = helper.analyzeBodyRecomposition(latest, compareRecord);

  // Target calculations
  const weightDifference = Math.round((latest.weight - latest.weightGoal) * 10) / 10;
  
  // Calculate percentage of progress towards target weight
  // If we have history, we can check starting weight, but if not, let's show distance.
  // A simple way: (latest.weightGoal / latest.weight) * 100, or a nice remaining indicator.
  const initialRecord = records[records.length - 1];
  let progressPercentage = 0;
  if (initialRecord && initialRecord.weight !== latest.weightGoal) {
    const totalToLose = initialRecord.weight - latest.weightGoal;
    const lostSoFar = initialRecord.weight - latest.weight;
    if (totalToLose !== 0) {
      progressPercentage = Math.min(Math.max(Math.round((lostSoFar / totalToLose) * 100), 0), 100);
    }
  } else {
    // Fallback based on closeness
    const diff = Math.abs(latest.weight - latest.weightGoal);
    progressPercentage = diff < 0.2 ? 100 : Math.max(0, Math.round((1 - diff / latest.weight) * 100));
  }

  return {
    hasData: true,
    latestRecord: {
      id: latest._id,
      weight: latest.weight,
      height: latest.height,
      weightGoal: latest.weightGoal,
      waist: latest.waist,
      neck: latest.neck,
      hip: latest.hip,
      notes: latest.notes,
      date: latest.date,
      type: latest.type,
      measuredFat,
      estimatedFat,
      activeFatPercentage,
      fatSource,
      fatCategory,
      bmi: bmiInfo.value,
      bmiClassification: bmiInfo.classification,
      whtr: whtrInfo.value,
      whtrRisk: whtrInfo.risk,
      wnr: wnrInfo ? wnrInfo.value : null,
      metabolicRisk
    },
    weightProgress: {
      current: latest.weight,
      goal: latest.weightGoal,
      remaining: Math.abs(weightDifference),
      isLossGoal: weightDifference >= 0,
      progressPercentage
    },
    caloricProfile: caloricProfile ? {
      bmr,
      tdee: caloricProfile.tdee,
      activityLevel: user.activityLevel,
      deficits: caloricProfile.deficits
    } : {
      warning: 'Ingresa tu fecha de nacimiento, sexo y nivel de actividad en Configuración para calcular tus necesidades calóricas.'
    },
    weeklyChange,
    monthlyTrend: {
      weeklyRate: monthlyChangeRate, // average kg change per week
      projection30,
      projection60,
      projection90,
      compareDate: prevMonthly ? prevMonthly.date : null
    },
    recomposition,
    userProfile: {
      gender: user.gender,
      age,
      birthDate: user.birthDate,
      activityLevel: user.activityLevel,
      hasProfile: !!(user.gender && user.birthDate && user.activityLevel)
    }
  };
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  getDashboard,
};

/**
 * Helper utilities for Body Composition and Metabolic Health calculations
 */

/**
 * Calculate age in years based on birthDate
 * @param {Date|string} birthDate 
 * @returns {number|null}
 */
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Calculate BMI (IMC) and its classification
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {{value: number, classification: string}}
 */
const calculateBMI = (weight, height) => {
  if (!weight || !height) return { value: 0, classification: 'Datos insuficientes' };
  const heightM = height / 100;
  const value = weight / (heightM * heightM);
  
  let classification = '';
  if (value < 18.5) classification = 'Bajo peso';
  else if (value < 25) classification = 'Peso normal';
  else if (value < 30) classification = 'Sobrepeso';
  else if (value < 35) classification = 'Obesidad I';
  else if (value < 40) classification = 'Obesidad II';
  else classification = 'Obesidad III';

  return {
    value: Math.round(value * 10) / 10,
    classification
  };
};

/**
 * Estimate Body Fat Percentage using the US Navy Circumference Method
 * @param {number} waist - Waist in cm
 * @param {number} neck - Neck in cm
 * @param {number} height - Height in cm
 * @param {number} [hip] - Hip in cm (required for females)
 * @param {string} gender - 'male' | 'female'
 * @returns {{value: number, category: string}|null}
 */
const calculateBodyFatNavy = (waist, neck, height, hip, gender) => {
  if (!waist || !neck || !height || !gender) return null;

  let fatPercentage = 0;
  
  if (gender === 'male') {
    // US Navy Formula for Men (cm): 
    // % Fat = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
    const waistNeckDiff = waist - neck;
    if (waistNeckDiff <= 0) return null;
    
    const density = 1.0324 - 0.19077 * Math.log10(waistNeckDiff) + 0.15456 * Math.log10(height);
    fatPercentage = 495 / density - 450;
  } else {
    // US Navy Formula for Women (cm):
    // % Fat = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
    const hipVal = hip || (waist * 1.15); // Fallback approximation if hip is missing
    const sumCirc = waist + hipVal - neck;
    if (sumCirc <= 0) return null;

    const density = 1.29579 - 0.35004 * Math.log10(sumCirc) + 0.22100 * Math.log10(height);
    fatPercentage = 495 / density - 450;
  }

  if (isNaN(fatPercentage) || !isFinite(fatPercentage) || fatPercentage < 2 || fatPercentage > 60) {
    return null;
  }

  // Round to 1 decimal
  const value = Math.round(fatPercentage * 10) / 10;
  
  // Classify Body Fat
  let category = '';
  if (gender === 'male') {
    if (value < 6) category = 'Esencial';
    else if (value < 14) category = 'Atleta';
    else if (value < 18) category = 'Fitness';
    else if (value < 25) category = 'Promedio';
    else category = 'Obesidad';
  } else {
    if (value < 14) category = 'Esencial';
    else if (value < 21) category = 'Atleta';
    else if (value < 25) category = 'Fitness';
    else if (value < 32) category = 'Promedio';
    else category = 'Obesidad';
  }

  return { value, category };
};

/**
 * Calculate Metabolic Age based on chronological age, BMI, and body fat percentage
 * @param {number} age - Chronological age in years
 * @param {number} bmi - Body Mass Index
 * @param {number} fatPercentage - Body fat percentage
 * @param {string} gender - 'male' | 'female'
 * @returns {number|null}
 */
const calculateMetabolicAge = (age, bmi, fatPercentage, gender) => {
  if (!age) return null;
  let metAge = age;
  
  if (bmi && bmi > 25) {
    metAge += (bmi - 25) * 0.6;
  } else if (bmi && bmi < 18.5) {
    metAge += (18.5 - bmi) * 0.4;
  }
  
  if (fatPercentage) {
    if (gender === 'male') {
      if (fatPercentage > 20) {
        metAge += (fatPercentage - 20) * 0.4;
      } else if (fatPercentage < 10) {
        metAge -= (10 - fatPercentage) * 0.2;
      }
    } else {
      if (fatPercentage > 28) {
        metAge += (fatPercentage - 28) * 0.4;
      } else if (fatPercentage < 18) {
        metAge -= (18 - fatPercentage) * 0.2;
      }
    }
  }
  
  // Cap metabolic age to range [age - 10, age + 15]
  return Math.round(Math.max(age - 10, Math.min(age + 15, metAge)));
};

/**
 * Calculate BMR (Mifflin-St Jeor)
 * @param {number} weight - in kg
 * @param {number} height - in cm
 * @param {number} age - in years
 * @param {string} gender - 'male'|'female'
 * @returns {number|null}
 */
const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age || !gender) return null;
  
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  return Math.round(bmr);
};

/**
 * Calculate Daily Energy Expenditure (TDEE) and deficit levels
 * @param {number} bmr 
 * @param {string} activityLevel 
 * @returns {{tdee: number, deficits: {conservative: number, moderate: number, aggressive: number}}}
 */
const calculateTDEECalories = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };

  const factor = multipliers[activityLevel] || 1.2;
  const tdee = Math.round(bmr * factor);

  return {
    tdee,
    deficits: {
      conservative: Math.round(tdee * 0.88), // ~12% deficit
      moderate: Math.round(tdee * 0.82),     // ~18% deficit
      aggressive: Math.round(tdee * 0.76)    // ~24% deficit
    }
  };
};

/**
 * Calculate Waist-to-Height Ratio (WHtR)
 * @param {number} waist - in cm
 * @param {number} height - in cm
 * @param {string} gender - 'male'|'female'
 * @returns {{value: number, risk: string}}
 */
const calculateWHtR = (waist, height, gender) => {
  if (!waist || !height) return { value: 0, risk: 'Datos insuficientes' };
  
  const value = waist / height;
  let risk = 'Riesgo Bajo (Saludable)';

  if (gender === 'male') {
    if (value < 0.4) risk = 'Bajo riesgo (Delgadez)';
    else if (value < 0.5) risk = 'Riesgo Bajo (Saludable)';
    else if (value < 0.6) risk = 'Riesgo Moderado (Sobrepeso)';
    else risk = 'Riesgo Alto (Obesidad)';
  } else {
    if (value < 0.4) risk = 'Bajo riesgo (Delgadez)';
    else if (value < 0.49) risk = 'Riesgo Bajo (Saludable)';
    else if (value < 0.54) risk = 'Riesgo Moderado (Sobrepeso)';
    else risk = 'Riesgo Alto (Obesidad)';
  }

  return {
    value: Math.round(value * 100) / 100,
    risk
  };
};

/**
 * Estimate Overall Metabolic Health Risk
 * @param {number} waist 
 * @param {number} height 
 * @param {string} gender 
 * @returns {string} - 'bajo' | 'moderado' | 'alto'
 */
const estimateMetabolicRisk = (waist, height, gender) => {
  if (!waist || !height || !gender) return 'Datos insuficientes';

  const whtr = waist / height;
  
  // High Risk thresholds
  const highWHtR = whtr >= 0.6;
  const highWaist = (gender === 'male' && waist > 102) || (gender === 'female' && waist > 88);

  if (highWHtR || highWaist) {
    return 'alto';
  }

  // Moderate Risk thresholds
  const modWHtR = whtr >= 0.5;
  const modWaist = (gender === 'male' && waist > 94) || (gender === 'female' && waist > 80);

  if (modWHtR || modWaist) {
    return 'moderado';
  }

  return 'bajo';
};

/**
 * Interpret physical trends over time to detect recomposition, muscle loss, fat gain, etc.
 * @param {Object} latest - Latest BodyComposition record
 * @param {Object} previous - Previous BodyComposition record (e.g. 7-30 days ago)
 * @returns {{status: string, observation: string}}
 */
const analyzeBodyRecomposition = (latest, previous) => {
  if (!latest || !previous) {
    return {
      status: 'Sin datos históricos',
      observation: 'Registra tu composición corporal periódicamente para analizar tus tendencias de recomposición física y salud metabólica.'
    };
  }

  const weightDiff = latest.weight - previous.weight;
  const waistDiff = latest.waist && previous.waist ? latest.waist - previous.waist : 0;
  
  const latestFat = latest.fatPercentage;
  const prevFat = previous.fatPercentage;
  const fatDiff = latestFat && prevFat ? latestFat - prevFat : null;

  const latestMuscle = latest.muscleMass;
  const prevMuscle = previous.muscleMass;
  const muscleDiff = latestMuscle && prevMuscle ? latestMuscle - prevMuscle : null;

  let status = 'Peso Estable';
  let observation = '';

  // Case 1: Losing weight
  if (weightDiff < -0.5) {
    if (waistDiff < -0.5) {
      if (muscleDiff !== null && muscleDiff < -0.6) {
        status = 'Pérdida de Peso y Músculo (Déficit Agresivo)';
        observation = 'Estás perdiendo peso y cintura, pero también masa muscular. Considera aumentar tu ingesta de proteínas y asegurar entrenamientos de fuerza para proteger tus músculos.';
      } else {
        status = 'Pérdida de Grasa Saludable';
        observation = '¡Excelente! Estás bajando de peso y reduciendo la cintura, lo cual indica una pérdida de tejido adiposo manteniendo tu masa muscular.';
      }
    } else if (waistDiff > 0.5) {
      status = 'Pérdida de Peso Inusual (Monitorear)';
      observation = 'Has bajado de peso, pero la medida de tu cintura aumentó. Esto podría deberse a retención de líquidos, inflamación o pérdida de masa magra.';
    } else {
      status = 'Déficit Calórico';
      observation = 'Estás bajando de peso de forma constante. Continúa monitoreando tus perímetros para asegurar que la pérdida proviene principalmente de grasa.';
    }
  } 
  // Case 2: Gaining weight
  else if (weightDiff > 0.5) {
    if (waistDiff > 0.5) {
      status = 'Superávit Calórico (Ganancia de Grasa)';
      observation = 'Estás ganando peso y tu cintura se ha incrementado. Esto indica que estás en un superávit calórico que está acumulando grasa corporal. Ajusta tu alimentación si buscas definir.';
    } else if (waistDiff < -0.5) {
      status = 'Recomposición Corporal / Volumen Magro';
      observation = '¡Asombroso! Estás ganando peso pero reduciendo tu cintura. Esto es el indicador definitivo de ganancia de masa muscular y pérdida de grasa simultánea.';
    } else {
      if (muscleDiff !== null && muscleDiff > 0.3) {
        status = 'Ganancia de Masa Muscular Limpia';
        observation = 'Estás ganando peso de forma controlada y tu masa muscular medida va en aumento, sin aumentar cintura. ¡Buen trabajo!';
      } else {
        status = 'Ganancia de Peso Corporal';
        observation = 'Estás subiendo de peso. Observa tu ingesta y asegúrate de complementar con entrenamiento físico para que sea un desarrollo muscular.';
      }
    }
  } 
  // Case 3: Weight is relatively stable (-0.5 to 0.5 kg change)
  else {
    if (waistDiff < -0.5) {
      status = 'Recomposición Corporal (Grasa a Músculo)';
      observation = '¡Espectacular! Tu peso se mantiene estable pero la cintura disminuye. Estás perdiendo grasa corporal y ganando masa muscular al mismo tiempo. Sigue así.';
    } else if (waistDiff > 0.5) {
      status = 'Cambio de Composición (Grasa Alta)';
      observation = 'Tu peso no ha cambiado, pero tu cintura ha aumentado. Ten cuidado, esto sugiere que podrías estar perdiendo músculo y acumulando grasa abdominal.';
    } else {
      if (muscleDiff !== null && muscleDiff > 0.3) {
        status = 'Ganancia de Músculo (Peso Estable)';
        observation = 'Tu peso se mantiene igual pero tu masa muscular va en aumento. Estás logrando una gran recomposición corporal.';
      } else {
        status = 'Mantenimiento Corporal';
        observation = 'Tu peso y medidas se mantienen estables. Estás en un equilibrio energético ideal para mantenimiento de tu composición actual.';
      }
    }
  }

  return { status, observation };
};

module.exports = {
  calculateAge,
  calculateBMI,
  calculateBodyFatNavy,
  calculateMetabolicAge,
  calculateBMR,
  calculateTDEECalories,
  calculateWHtR,
  estimateMetabolicRisk,
  analyzeBodyRecomposition
};

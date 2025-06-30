const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');

/**
 * Main correlation insights handler
 */
async function handleGetCorrelationInsights(queryParams, event) {
  try {
    const userId = queryParams?.user_id || queryParams?.userId;
    const timeframeDays = parseInt(queryParams?.timeframe_days) || 180;
    const confidenceThreshold = parseFloat(queryParams?.confidence_threshold) || 0.6;

    if (!userId) {
      return errorResponse('user_id parameter is required', 400);
    }

    // Get timeline data for the user
    const timelineData = await getTimelineData(userId, timeframeDays);
    
    if (timelineData.length === 0) {
      return successResponse({
        insights: [],
        summary: { totalCorrelations: 0, triggers: 0, improvements: 0 }
      });
    }

    // Run correlation analysis
    const correlations = await detectCorrelations(timelineData, confidenceThreshold);

    const summary = {
      totalCorrelations: correlations.length,
      triggers: correlations.filter(c => c.type === 'food-symptom').length,
      improvements: correlations.filter(c => c.type === 'supplement-improvement').length,
      protocolEffects: correlations.filter(c => c.type === 'protocol-effectiveness').length
    };

    return successResponse({
      insights: correlations,
      summary,
      timeframe_days: timeframeDays,
      confidence_threshold: confidenceThreshold
    });

  } catch (error) {
    console.error('Correlation analysis error:', error);
    return errorResponse('Failed to analyze correlations', 500);
  }
}

/**
 * Get timeline data for correlation analysis
 */
async function getTimelineData(userId, timeframeDays) {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        entry_date,
        entry_time,
        entry_type,
        content,
        severity,
        protocol_compliant,
        (entry_date + entry_time) as full_timestamp
      FROM timeline_entries 
      WHERE user_id = $1 
        AND entry_date >= CURRENT_DATE - INTERVAL '${timeframeDays} days'
      ORDER BY entry_date, entry_time
    `;

    const result = await client.query(query, [userId]);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Main correlation detection engine
 */
async function detectCorrelations(timelineData, confidenceThreshold) {
  const correlations = [];

  // 1. Food-Symptom Correlations (time-delayed triggers)
  const foodSymptomCorrelations = await detectFoodSymptomCorrelations(timelineData, confidenceThreshold);
  correlations.push(...foodSymptomCorrelations);

  // 2. Supplement-Improvement Correlations (long-term benefits)
  const supplementCorrelations = await detectSupplementImprovements(timelineData, confidenceThreshold);
  correlations.push(...supplementCorrelations);

  // 3. Protocol Effectiveness (overall health improvements)
  const protocolCorrelations = await detectProtocolEffectiveness(timelineData, confidenceThreshold);
  correlations.push(...protocolCorrelations);

  return correlations;
}

/**
 * Detect food → symptom correlations with time delays
 */
async function detectFoodSymptomCorrelations(timelineData, confidenceThreshold) {
  const correlations = [];
  
  // Get food entries and symptoms
  const foodEntries = timelineData.filter(entry => entry.entry_type === 'food');
  const symptomEntries = timelineData.filter(entry => entry.entry_type === 'symptom');

  if (foodEntries.length === 0 || symptomEntries.length === 0) {
    return correlations;
  }

  // Get food properties for nightshade/histamine analysis
  const foodProperties = await getFoodProperties();
  
  // Time windows to check (in hours)
  const timeWindows = [
    { name: 'immediate', hours: 8, description: 'within 8 hours' },
    { name: 'short', hours: 24, description: 'within 24 hours' },
    { name: 'medium', hours: 48, description: 'within 48 hours' },
    { name: 'delayed', hours: 72, description: 'within 72 hours' }
  ];

  // Group foods by properties
  const foodsByProperty = groupFoodsByProperties(foodEntries, foodProperties);

  // Check each food property group against symptoms
  for (const [propertyName, propertyFoods] of Object.entries(foodsByProperty)) {
    if (propertyFoods.length < 3) continue; // Need minimum instances

    for (const window of timeWindows) {
      for (const symptomType of getUniqueSymptoms(symptomEntries)) {
        const correlation = analyzePropertySymptomCorrelation(
          propertyFoods, 
          symptomEntries.filter(s => s.content === symptomType),
          window,
          propertyName,
          symptomType
        );

        if (correlation.confidence >= confidenceThreshold) {
          correlations.push(correlation);
        }
      }
    }
  }

  // Also check individual foods with high correlation
  const individualFoodCorrelations = await analyzeIndividualFoodCorrelations(
    foodEntries, symptomEntries, timeWindows, confidenceThreshold
  );
  correlations.push(...individualFoodCorrelations);

  return correlations;
}

/**
 * Group foods by their properties (nightshade, high histamine, etc.)
 */
function groupFoodsByProperties(foodEntries, foodProperties) {
  const propertyGroups = {
    'nightshade foods': [],
    'high histamine foods': [],
    'high oxalate foods': [],
    'high lectin foods': []
  };

  for (const entry of foodEntries) {
    const foods = entry.content.split(',').map(f => f.trim().toLowerCase());
    
    for (const foodName of foods) {
      const props = foodProperties[foodName];
      if (!props) continue;

      if (props.nightshade) {
        propertyGroups['nightshade foods'].push({ ...entry, specificFood: foodName });
      }
      if (props.histamine === 'high') {
        propertyGroups['high histamine foods'].push({ ...entry, specificFood: foodName });
      }
      if (props.oxalate === 'high') {
        propertyGroups['high oxalate foods'].push({ ...entry, specificFood: foodName });
      }
      if (props.lectin === 'high') {
        propertyGroups['high lectin foods'].push({ ...entry, specificFood: foodName });
      }
    }
  }

  return propertyGroups;
}

/**
 * Analyze correlation between food property and symptom
 */
function analyzePropertySymptomCorrelation(propertyFoods, symptoms, timeWindow, propertyName, symptomType) {
  let correlationCount = 0;
  let totalOpportunities = 0;

  for (const foodEntry of propertyFoods) {
    const foodTime = new Date(`${foodEntry.entry_date}T${foodEntry.entry_time}`);
    const windowEnd = new Date(foodTime.getTime() + timeWindow.hours * 60 * 60 * 1000);

    // Look for symptoms in the time window
    const symptomInWindow = symptoms.find(symptom => {
      const symptomTime = new Date(`${symptom.entry_date}T${symptom.entry_time}`);
      return symptomTime > foodTime && symptomTime <= windowEnd;
    });

    totalOpportunities++;
    if (symptomInWindow) {
      correlationCount++;
    }
  }

  const confidence = totalOpportunities > 0 ? correlationCount / totalOpportunities : 0;
  const frequency = `${correlationCount}/${totalOpportunities} times`;

  return {
    type: 'food-symptom',
    trigger: propertyName,
    effect: symptomType,
    timeWindow: timeWindow.hours,
    timeWindowDescription: timeWindow.description,
    confidence: Math.round(confidence * 100) / 100,
    frequency,
    occurrences: correlationCount,
    totalOpportunities,
    description: `${propertyName} appear to trigger ${symptomType} ${timeWindow.description}`,
    recommendation: confidence > 0.7 ? 
      `Consider avoiding ${propertyName} for 2-4 weeks to test sensitivity` :
      `Monitor ${propertyName} consumption and ${symptomType} symptoms`
  };
}

/**
 * Analyze individual food correlations (for specific trigger foods)
 */
async function analyzeIndividualFoodCorrelations(foodEntries, symptoms, timeWindows, confidenceThreshold) {
  const correlations = [];
  const foodCounts = {};

  // Count individual foods
  for (const entry of foodEntries) {
    const foods = entry.content.split(',').map(f => f.trim().toLowerCase());
    for (const food of foods) {
      if (!foodCounts[food]) foodCounts[food] = [];
      foodCounts[food].push(entry);
    }
  }

  // Analyze foods with sufficient data points
  for (const [foodName, foodInstances] of Object.entries(foodCounts)) {
    if (foodInstances.length < 3) continue;

    for (const window of timeWindows) {
      for (const symptomType of getUniqueSymptoms(symptoms)) {
        const symptomTypeEntries = symptoms.filter(s => s.content === symptomType);
        
        const correlation = analyzeIndividualFoodSymptomCorrelation(
          foodInstances, symptomTypeEntries, window, foodName, symptomType
        );

        if (correlation.confidence >= confidenceThreshold) {
          correlations.push(correlation);
        }
      }
    }
  }

  return correlations;
}

/**
 * Analyze individual food → symptom correlation
 */
function analyzeIndividualFoodSymptomCorrelation(foodInstances, symptoms, timeWindow, foodName, symptomType) {
  let correlationCount = 0;
  let totalOpportunities = foodInstances.length;

  for (const foodEntry of foodInstances) {
    const foodTime = new Date(`${foodEntry.entry_date}T${foodEntry.entry_time}`);
    const windowEnd = new Date(foodTime.getTime() + timeWindow.hours * 60 * 60 * 1000);

    const symptomInWindow = symptoms.find(symptom => {
      const symptomTime = new Date(`${symptom.entry_date}T${symptom.entry_time}`);
      return symptomTime > foodTime && symptomTime <= windowEnd;
    });

    if (symptomInWindow) {
      correlationCount++;
    }
  }

  const confidence = correlationCount / totalOpportunities;
  const frequency = `${correlationCount}/${totalOpportunities} times`;

  return {
    type: 'food-symptom',
    trigger: foodName,
    effect: symptomType,
    timeWindow: timeWindow.hours,
    timeWindowDescription: timeWindow.description,
    confidence: Math.round(confidence * 100) / 100,
    frequency,
    occurrences: correlationCount,
    totalOpportunities,
    description: `${foodName} appears to trigger ${symptomType} ${timeWindow.description}`,
    recommendation: confidence > 0.7 ? 
      `Consider avoiding ${foodName} for 2-4 weeks to test sensitivity` :
      `Monitor ${foodName} consumption and ${symptomType} symptoms`
  };
}

/**
 * Detect supplement → improvement correlations
 */
async function detectSupplementImprovements(timelineData, confidenceThreshold) {
  const correlations = [];
  
  const supplementEntries = timelineData.filter(entry => entry.entry_type === 'supplement');
  const symptomEntries = timelineData.filter(entry => entry.entry_type === 'symptom');

  if (supplementEntries.length === 0 || symptomEntries.length === 0) {
    return correlations;
  }

  // Group supplements by type
  const supplementGroups = {};
  for (const entry of supplementEntries) {
    const supplement = entry.content.toLowerCase().trim();
    if (!supplementGroups[supplement]) {
      supplementGroups[supplement] = [];
    }
    supplementGroups[supplement].push(entry);
  }

  // Analyze each supplement for improvements
  for (const [supplementName, supplementInstances] of Object.entries(supplementGroups)) {
    if (supplementInstances.length < 7) continue; // Need at least a week of data

    // Find supplement start date
    const startDate = new Date(Math.min(...supplementInstances.map(s => new Date(`${s.entry_date}T${s.entry_time}`))));
    
    // Analyze impact on symptoms
    for (const symptomType of getUniqueSymptoms(symptomEntries)) {
      const correlation = analyzeSupplementSymptomImprovement(
        supplementInstances, 
        symptomEntries.filter(s => s.content === symptomType),
        startDate,
        supplementName,
        symptomType
      );

      if (correlation.confidence >= confidenceThreshold) {
        correlations.push(correlation);
      }
    }
  }

  return correlations;
}

/**
 * Analyze supplement → symptom improvement
 */
function analyzeSupplementSymptomImprovement(supplementInstances, symptoms, startDate, supplementName, symptomType) {
  // Compare 4 weeks before vs 4 weeks after supplement start
  const fourWeeksBefore = new Date(startDate.getTime() - 28 * 24 * 60 * 60 * 1000);
  const fourWeeksAfter = new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000);

  const symptomsBefore = symptoms.filter(s => {
    const sympTime = new Date(`${s.entry_date}T${s.entry_time}`);
    return sympTime >= fourWeeksBefore && sympTime < startDate;
  });

  const symptomsAfter = symptoms.filter(s => {
    const sympTime = new Date(`${s.entry_date}T${s.entry_time}`);
    return sympTime >= startDate && sympTime <= fourWeeksAfter;
  });

  if (symptomsBefore.length === 0 && symptomsAfter.length === 0) {
    return { confidence: 0 };
  }

  // Calculate average severity before and after
  const avgSeverityBefore = symptomsBefore.length > 0 ? 
    symptomsBefore.reduce((sum, s) => sum + (s.severity || 0), 0) / symptomsBefore.length : 0;
  
  const avgSeverityAfter = symptomsAfter.length > 0 ? 
    symptomsAfter.reduce((sum, s) => sum + (s.severity || 0), 0) / symptomsAfter.length : 0;

  // Calculate frequency change
  const frequencyBefore = symptomsBefore.length / 28; // per day
  const frequencyAfter = symptomsAfter.length / 28; // per day

  const severityImprovement = avgSeverityBefore > 0 ? (avgSeverityBefore - avgSeverityAfter) / avgSeverityBefore : 0;
  const frequencyImprovement = frequencyBefore > 0 ? (frequencyBefore - frequencyAfter) / frequencyBefore : 0;

  // Overall improvement confidence
  const confidence = Math.max(severityImprovement, frequencyImprovement);

  if (confidence <= 0) {
    return { confidence: 0 };
  }

  return {
    type: 'supplement-improvement',
    trigger: supplementName,
    effect: `reduced ${symptomType}`,
    timeWindow: 28 * 24, // 4 weeks in hours
    timeWindowDescription: 'after 4 weeks',
    confidence: Math.round(confidence * 100) / 100,
    frequency: `${Math.round(frequencyImprovement * 100)}% reduction in frequency`,
    severityChange: `${Math.round(severityImprovement * 100)}% reduction in severity`,
    description: `${supplementName} appears to reduce ${symptomType} after 4 weeks`,
    recommendation: confidence > 0.5 ? 
      `Continue ${supplementName} supplementation - showing positive effects` :
      `Monitor ${supplementName} effects over longer period`
  };
}

/**
 * Detect protocol effectiveness
 */
async function detectProtocolEffectiveness(timelineData, confidenceThreshold) {
  // This would analyze overall protocol compliance vs symptom improvements
  // For now, return empty array - can be implemented later
  return [];
}

/**
 * Get food properties for correlation analysis
 */
async function getFoodProperties() {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT name, nightshade, histamine, oxalate, lectin
      FROM food_properties
    `;
    
    const result = await client.query(query);
    const properties = {};
    
    for (const row of result.rows) {
      properties[row.name.toLowerCase()] = {
        nightshade: row.nightshade,
        histamine: row.histamine,
        oxalate: row.oxalate,
        lectin: row.lectin
      };
    }
    
    return properties;
  } finally {
    client.release();
  }
}

/**
 * Get unique symptom types
 */
function getUniqueSymptoms(symptomEntries) {
  return [...new Set(symptomEntries.map(s => s.content))];
}

module.exports = {
  handleGetCorrelationInsights
};
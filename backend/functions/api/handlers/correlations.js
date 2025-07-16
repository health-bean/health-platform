const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { getCurrentUser, getAccessibleUserIds } = require('../middleware/auth');

/**
 * Main correlation insights handler - Enhanced for comprehensive health tracking
 * Now supports both demo and real user authentication
 */
async function handleGetCorrelationInsights(queryParams, event) {
  try {
    // EXTENSIVE DEBUGGING
    console.log('CORRELATIONS DEBUG: ===== START =====');
    console.log('CORRELATIONS DEBUG: Event:', JSON.stringify(event, null, 2));
    console.log('CORRELATIONS DEBUG: Headers:', JSON.stringify(event.headers, null, 2));
    console.log('CORRELATIONS DEBUG: Query params:', JSON.stringify(queryParams, null, 2));
    
    const timeframeDays = parseInt(queryParams?.timeframe_days) || 180;
    const confidenceThreshold = parseFloat(queryParams?.confidence_threshold) || 0.6;
    const requestedUserId = queryParams?.user_id || queryParams?.userId;
    
    console.log('CORRELATIONS DEBUG: Parsed params:', { 
      timeframeDays, 
      confidenceThreshold,
      requestedUserId 
    });

    // Check if demo headers are present
    const demoMode = event.headers['X-Demo-Mode'] || event.headers['x-demo-mode'];
    const demoUserId = event.headers['X-Demo-User-Id'] || event.headers['x-demo-user-id'];
    console.log('CORRELATIONS DEBUG: Demo headers:', { demoMode, demoUserId });

    // Use auth middleware to get current user (handles both demo and Cognito users)
    console.log('CORRELATIONS DEBUG: About to call getCurrentUser');
    const user = await getCurrentUser(event);
    console.log('CORRELATIONS DEBUG: getCurrentUser returned:', user ? JSON.stringify(user, null, 2) : 'null');
    
    // No fallbacks - use proper authentication only
    if (!user) {
      console.log('CORRELATIONS DEBUG: Authentication failed - no user found');
      return errorResponse('Authentication required', 401);
    }
    
    const userId = user.id;
    console.log('CORRELATIONS DEBUG: Using authenticated user ID:', userId);
    console.log('CORRELATIONS DEBUG: User object:', JSON.stringify(user, null, 2));

    // Get timeline data for the authenticated user
    const timelineData = await getTimelineData(userId, timeframeDays);
    
    if (timelineData.length === 0) {
      return successResponse({
        insights: [],
        summary: { totalCorrelations: 0, triggers: 0, improvements: 0, medicationEffects: 0, exerciseImpacts: 0 }
      });
    }

    // Run comprehensive correlation analysis
    const correlations = await detectAllCorrelations(timelineData, confidenceThreshold);

    const summary = {
      totalCorrelations: correlations.length,
      triggers: correlations.filter(c => c.type === 'food-symptom').length,
      improvements: correlations.filter(c => c.type === 'supplement-improvement').length,
      medicationEffects: correlations.filter(c => c.type === 'medication-effect').length,
      exerciseImpacts: correlations.filter(c => c.type === 'exercise-energy').length,
      sleepFactors: correlations.filter(c => c.type === 'sleep-quality').length,
      stressAmplifiers: correlations.filter(c => c.type === 'stress-symptom').length,
      foodPatterns: correlations.filter(c => c.type === 'food-property-pattern').length
    };

    return successResponse({
      insights: correlations,
      summary,
      timeframe_days: timeframeDays,
      confidence_threshold: confidenceThreshold,
      user_id: userId
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
  let client;
  
  try {
    console.log('CORRELATIONS DEBUG: Getting timeline data for user:', userId);
    console.log('CORRELATIONS DEBUG: Timeframe days:', timeframeDays);
    
    client = await pool.connect();
    console.log('CORRELATIONS DEBUG: Database connection successful');
    
    // Updated query to match the actual database schema (no content or severity columns)
    // Added timeframe filtering based on days parameter
    const query = `
      SELECT 
        id,
        journal_entry_id,
        user_id,
        entry_date,
        entry_time,
        entry_type,
        structured_content,
        created_at
      FROM timeline_entries 
      WHERE user_id = $1 
        AND entry_date >= CURRENT_DATE - INTERVAL '${timeframeDays} days'
      ORDER BY entry_date DESC, entry_time DESC
    `;

    console.log('CORRELATIONS DEBUG: Executing query with params:', [userId]);
    const result = await client.query(query, [userId]);
    console.log('CORRELATIONS DEBUG: Query successful, returned rows:', result.rows.length);
    
    // Transform data for correlation analysis, extracting content and severity from structured_content
    const transformedRows = result.rows.map(row => {
      // Initialize content and severity since they don't exist in the database schema
      let content = '';
      let severity = 5; // Default severity
      
      // If structured_content exists, extract more detailed information
      if (row.structured_content) {
        try {
          const structured = typeof row.structured_content === 'string' 
            ? JSON.parse(row.structured_content) 
            : row.structured_content;
          
          // Extract severity from structured_content if not already in the severity column
          if (!row.severity) {
            severity = structured.severity || 
                      structured.symptom_severity || 
                      structured.level || 
                      structured.intensity || 
                      5;
          }
          
          // Extract the main item name based on entry type and structured content format
          switch (row.entry_type) {
            case 'food':
              // Handle both timeline format (food_name) and journal format (foods array)
              if (structured.food_name) {
                content = structured.food_name;
              } else if (structured.foods && Array.isArray(structured.foods) && structured.foods.length > 0) {
                // For multiple foods, join the first few names
                const foodNames = structured.foods.slice(0, 3).map(food => food.name || food).filter(Boolean);
                content = foodNames.length > 0 ? foodNames.join(', ') : content;
              } else if (structured.name) {
                content = structured.name;
              } else if (structured.item_name) {
                content = structured.item_name;
              }
              break;
            case 'symptom':
              content = structured.symptom_name || structured.name || structured.item_name || content;
              break;
            case 'supplement':
              content = structured.supplement_name || structured.name || structured.item_name || content;
              break;
            case 'medication':
              content = structured.medication_name || structured.name || structured.item_name || content;
              break;
            case 'exposure':
              content = structured.exposure_type || structured.name || structured.item_name || content;
              break;
            case 'detox':
              content = structured.detox_type || structured.name || structured.item_name || content;
              break;
            case 'exercise':
              content = structured.exercise_type || structured.name || structured.item_name || content;
              break;
            case 'mood':
            case 'energy':
            case 'stress':
              content = structured[`${row.entry_type}_description`] || structured.name || structured.item_name || content;
              break;
            case 'sleep':
              content = structured.sleep_description || structured.name || structured.item_name || content;
              break;
            default:
              content = structured.name || structured.item_name || content;
          }
        } catch (error) {
          console.warn('Error parsing structured_content for correlation analysis:', error);
          // Keep original content if parsing fails
        }
      }
      
      return {
        ...row,
        content, // Ensure content field is available for correlation logic
        severity // Ensure severity field is available for correlation logic
      };
    });
    
    return transformedRows;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Enhanced correlation detection engine
 */
async function detectAllCorrelations(timelineData, confidenceThreshold) {
  const correlations = [];

  // 1. ENHANCED: Food-Symptom Correlations with Pattern Detection
  const foodSymptomCorrelations = await detectFoodSymptomCorrelations(timelineData, confidenceThreshold);
  correlations.push(...foodSymptomCorrelations);

  // 2. Supplement-Improvement Correlations
  const supplementCorrelations = await detectSupplementImprovements(timelineData, confidenceThreshold);
  correlations.push(...supplementCorrelations);

  // 3. Medication-Side Effect Correlations
  const medicationCorrelations = await detectMedicationEffects(timelineData, confidenceThreshold);
  correlations.push(...medicationCorrelations);

  // 4. Exercise-Energy Correlations
  const exerciseCorrelations = await detectExerciseEnergyCorrelations(timelineData, confidenceThreshold);
  correlations.push(...exerciseCorrelations);

  // 5. Sleep Quality Correlations
  const sleepCorrelations = await detectSleepQualityCorrelations(timelineData, confidenceThreshold);
  correlations.push(...sleepCorrelations);

  // 6. Stress-Symptom Amplification
  const stressCorrelations = await detectStressSymptomCorrelations(timelineData, confidenceThreshold);
  correlations.push(...stressCorrelations);

  return correlations;
}

/**
 * ENHANCED: Food-symptom correlations with pattern detection
 */
async function detectFoodSymptomCorrelations(timelineData, confidenceThreshold) {
  const correlations = [];
  
  const foodEntries = timelineData.filter(entry => entry.entry_type === 'food');
  const symptomEntries = timelineData.filter(entry => entry.entry_type === 'symptom');

  if (foodEntries.length === 0 || symptomEntries.length === 0) {
    return correlations;
  }

  const foodProperties = await getFoodProperties();
  
  const timeWindows = [
    { name: 'immediate', hours: 8, description: 'within 8 hours' },
    { name: 'short', hours: 24, description: 'within 24 hours' },
    { name: 'medium', hours: 48, description: 'within 48 hours' }
  ];

  // Step 1: Get individual food correlations
  const individualCorrelations = await getIndividualFoodCorrelations(
    foodEntries, symptomEntries, timeWindows, confidenceThreshold
  );

  // Step 2: NEW - Detect food property patterns
  const patternCorrelations = await detectFoodPropertyPatterns(
    individualCorrelations, foodProperties, confidenceThreshold
  );

  // Step 3: Return pattern correlations + remaining individual correlations
  const finalCorrelations = [...patternCorrelations];
  
  // Add individual correlations that weren't grouped into patterns
  for (const correlation of individualCorrelations) {
    const isPartOfPattern = patternCorrelations.some(pattern => 
      pattern.contributingFoods && pattern.contributingFoods.includes(correlation.trigger)
    );
    
    if (!isPartOfPattern) {
      finalCorrelations.push(correlation);
    }
  }

  return finalCorrelations;
}

/**
 * FIXED: Get individual food correlations - More lenient threshold
 */
async function getIndividualFoodCorrelations(foodEntries, symptomEntries, timeWindows, confidenceThreshold) {
  const correlations = [];
  
  // Group foods by name
  const foodCounts = {};
  for (const entry of foodEntries) {
    const foods = entry.content.split(',').map(f => f.trim().toLowerCase());
    for (const food of foods) {
      if (!foodCounts[food]) foodCounts[food] = [];
      foodCounts[food].push(entry);
    }
  }

  // Analyze each food
  for (const [foodName, foodInstances] of Object.entries(foodCounts)) {
    // FIXED: Changed from 3 to 2 minimum instances for more data
    if (foodInstances.length < 2) continue;

    for (const window of timeWindows) {
      for (const symptomType of getUniqueSymptoms(symptomEntries)) {
        const symptomTypeEntries = symptomEntries.filter(s => s.content === symptomType);
        
        const correlation = analyzePersonalizedFoodSymptomCorrelation(
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
 * FIXED: Detect food property patterns - Changed from 3+ to 2+ foods threshold
 */
async function detectFoodPropertyPatterns(individualCorrelations, foodProperties, confidenceThreshold) {
  const patternCorrelations = [];
  
  // Group correlations by symptom and time window
  const symptomGroups = {};
  
  for (const correlation of individualCorrelations) {
    const key = `${correlation.effect}_${correlation.timeWindow}`;
    if (!symptomGroups[key]) {
      symptomGroups[key] = [];
    }
    symptomGroups[key].push(correlation);
  }

  // Analyze each symptom group for food property patterns
  for (const [key, correlations] of Object.entries(symptomGroups)) {
    // FIXED: Changed from 3 to 2 correlations minimum
    if (correlations.length < 2) continue;

    const patterns = await findFoodPropertyPatterns(correlations, foodProperties);
    
    for (const pattern of patterns) {
      if (pattern.confidence >= confidenceThreshold) {
        patternCorrelations.push(pattern);
      }
    }
  }

  return patternCorrelations;
}

/**
 * FIXED: Find patterns based on food properties - Changed from 3+ to 2+ foods threshold
 */
async function findFoodPropertyPatterns(correlations, foodProperties) {
  const patterns = [];
  
  // Define property categories to check
  const propertyCategories = [
    { name: 'high oxalate', property: 'oxalate', values: ['high', 'very high'] },
    { name: 'high histamine', property: 'histamine', values: ['high', 'very high'] },
    { name: 'high lectin', property: 'lectin', values: ['high', 'very high'] },
    { name: 'nightshade', property: 'nightshade', values: [true] },
    { name: 'high FODMAP', property: 'fodmap', values: ['high', 'very high'] },
    { name: 'high salicylate', property: 'salicylate', values: ['high', 'very high'] }
  ];

  // Check each property category
  for (const category of propertyCategories) {
    const matchingCorrelations = correlations.filter(correlation => {
      const foodProps = foodProperties[correlation.trigger.toLowerCase()];
      if (!foodProps) return false;
      
      const propertyValue = foodProps[category.property];
      return category.values.includes(propertyValue);
    });

    // FIXED: Changed from 3+ to 2+ foods minimum for pattern
    if (matchingCorrelations.length >= 2) {
      const pattern = createPropertyPattern(category, matchingCorrelations);
      patterns.push(pattern);
    }
  }

  return patterns;
}

/**
 * Create a food property pattern correlation
 */
function createPropertyPattern(category, matchingCorrelations) {
  // Calculate pattern confidence (average of individual correlations)
  const avgConfidence = matchingCorrelations.reduce((sum, c) => sum + c.confidence, 0) / matchingCorrelations.length;
  
  // Calculate total occurrences
  const totalOccurrences = matchingCorrelations.reduce((sum, c) => sum + c.occurrences, 0);
  const totalOpportunities = matchingCorrelations.reduce((sum, c) => sum + c.totalOpportunities, 0);
  
  // Get consistent time window and symptom
  const timeWindow = matchingCorrelations[0].timeWindow;
  const timeWindowDescription = matchingCorrelations[0].timeWindowDescription;
  const symptomType = matchingCorrelations[0].effect;
  
  // Contributing foods
  const contributingFoods = matchingCorrelations.map(c => c.trigger);
  const foodList = contributingFoods.length > 3 
    ? `${contributingFoods.slice(0, 3).join(', ')} and ${contributingFoods.length - 3} others`
    : contributingFoods.join(', ');

  const percentage = Math.round(avgConfidence * 100);

  return {
    type: 'food-property-pattern',
    trigger: `${category.name} foods`,
    effect: symptomType,
    timeWindow,
    timeWindowDescription,
    confidence: Math.round(avgConfidence * 100) / 100,
    frequency: `${totalOccurrences}/${totalOpportunities} times`,
    occurrences: totalOccurrences,
    totalOpportunities,
    
    // Pattern-specific data
    propertyType: category.property,
    propertyValue: category.name,
    contributingFoods,
    foodCount: contributingFoods.length,
    
    // Enhanced description for patterns
    description: `🔍 Your data suggests ${category.name} foods may trigger ${symptomType} (${contributingFoods.length} foods: ${foodList})`,
    
    // Enhanced recommendation for patterns
    recommendation: percentage > 60 
      ? `Consider avoiding ${category.name} foods to test your sensitivity. This includes: ${foodList}`
      : `Monitor your reaction to ${category.name} foods more closely. Focus on: ${foodList}`,
    
    // Additional pattern insights
    patternInsight: `This pattern suggests you may be sensitive to ${category.name} compounds. Common sources include: ${foodList}`,
    
    // Confidence boost for patterns (stronger evidence when multiple foods align)
    patternBoost: Math.min(contributingFoods.length * 0.05, 0.15) // Up to 15% boost for strong patterns
  };
}

/**
 * ENHANCED: Analyze food-symptom correlation with impact scoring
 */
function analyzePersonalizedFoodSymptomCorrelation(foodInstances, symptoms, timeWindow, foodName, symptomType) {
  let correlationCount = 0;
  let totalOpportunities = foodInstances.length;
  let severitySum = 0;
  let severityCount = 0;

  for (const foodEntry of foodInstances) {
    const foodTime = parseDateTime(foodEntry);
    const windowEnd = new Date(foodTime.getTime() + timeWindow.hours * 60 * 60 * 1000);

    const symptomInWindow = symptoms.find(symptom => {
      const symptomTime = parseDateTime(symptom);
      return symptomTime > foodTime && symptomTime <= windowEnd;
    });

    if (symptomInWindow) {
      correlationCount++;
      // Get severity from structured_content if available
      const structured = symptomInWindow.structured_content ? 
        (typeof symptomInWindow.structured_content === 'string' ? 
          JSON.parse(symptomInWindow.structured_content) : 
          symptomInWindow.structured_content) : {};
      
      const symptomSeverity = structured.severity || 5; // Default to 5 if not found
      severitySum += symptomSeverity;
      severityCount++;
    }
  }

  const confidence = correlationCount / totalOpportunities;
  const percentage = Math.round(confidence * 100);
  const avgSeverity = severityCount > 0 ? severitySum / severityCount : null;

  return {
    type: 'food-symptom',
    trigger: foodName,
    effect: symptomType,
    timeWindow: timeWindow.hours,
    timeWindowDescription: timeWindow.description,
    confidence: Math.round(confidence * 100) / 100,
    frequency: `${correlationCount}/${totalOpportunities} times`,
    occurrences: correlationCount,
    totalOpportunities,
    avgSeverity: avgSeverity ? Math.round(avgSeverity * 10) / 10 : null,
    
    // Enhanced impact scoring
    impactScore: calculateImpactScore(confidence, avgSeverity, correlationCount),
    
    description: percentage > 70 
      ? `🔍 Your data suggests ${foodName} may trigger ${symptomType} (${percentage}% of the time)`
      : percentage > 40 
      ? `🔍 Your data suggests ${foodName} may trigger ${symptomType} (${percentage}% of instances)`
      : `🔍 Possible pattern: ${foodName} and ${symptomType} (${percentage}% correlation)`,
    
    recommendation: percentage > 60 
      ? `Consider eliminating ${foodName} for 2-4 weeks to test your sensitivity`
      : percentage > 30 
      ? `Monitor ${foodName} consumption and ${symptomType} symptoms more closely`
      : `Continue tracking to confirm this potential trigger pattern`
  };
}

/**
 * Calculate impact score for sorting (patterns get higher scores)
 */
function calculateImpactScore(confidence, avgSeverity, occurrences) {
  let score = confidence;
  
  // Boost for higher severity
  if (avgSeverity) {
    score += (avgSeverity / 10) * 0.2; // Up to 20% boost for severity 10
  }
  
  // Boost for more occurrences (more data = more reliable)
  if (occurrences >= 5) {
    score += 0.1; // 10% boost for 5+ occurrences
  }
  
  return Math.min(score, 1.0);
}

/**
 * ENHANCED: Get food properties for pattern analysis
 */
async function getFoodProperties() {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        name, 
        nightshade, 
        histamine, 
        oxalate, 
        lectin, 
        fodmap, 
        salicylate,
        category
      FROM food_properties
    `;
    
    const result = await client.query(query);
    const properties = {};
    
    for (const row of result.rows) {
      properties[row.name.toLowerCase()] = {
        nightshade: row.nightshade,
        histamine: row.histamine,
        oxalate: row.oxalate,
        lectin: row.lectin,
        fodmap: row.fodmap,
        salicylate: row.salicylate,
        category: row.category
      };
    }
    
    return properties;
  } catch (error) {
    console.error('Error fetching food properties:', error);
    return {}; // Return empty object if database fails
  } finally {
    client.release();
  }
}

/**
 * FIXED: Detect medication → side effect correlations - More lenient threshold
 */
async function detectMedicationEffects(timelineData, confidenceThreshold) {
  const correlations = [];
  
  const medicationEntries = timelineData.filter(entry => entry.entry_type === 'medication');
  const sideEffectEntries = timelineData.filter(entry => entry.entry_type === 'side_effect' || entry.entry_type === 'symptom');

  if (medicationEntries.length === 0 || sideEffectEntries.length === 0) {
    return correlations;
  }

  // Group medications
  const medicationGroups = {};
  for (const entry of medicationEntries) {
    const medication = entry.content.toLowerCase().trim();
    if (!medicationGroups[medication]) {
      medicationGroups[medication] = [];
    }
    medicationGroups[medication].push(entry);
  }

  // Analyze each medication for side effects
  for (const [medicationName, medicationInstances] of Object.entries(medicationGroups)) {
    // FIXED: Changed from 3 to 2 minimum instances
    if (medicationInstances.length < 2) continue;

    for (const effectType of getUniqueSymptoms(sideEffectEntries)) {
      const correlation = analyzeMedicationSideEffectCorrelation(
        medicationInstances,
        sideEffectEntries.filter(s => s.content === effectType),
        medicationName,
        effectType
      );

      if (correlation.confidence >= confidenceThreshold) {
        correlations.push(correlation);
      }
    }
  }

  return correlations;
}

/**
 * Analyze medication → side effect correlation with personalized language
 */
function analyzeMedicationSideEffectCorrelation(medicationInstances, sideEffects, medicationName, effectType) {
  let correlationCount = 0;
  let totalDoses = medicationInstances.length;

  for (const medEntry of medicationInstances) {
    const medTime = parseDateTime(medEntry);
    const windowEnd = new Date(medTime.getTime() + 6 * 60 * 60 * 1000); // 6 hours

    const effectInWindow = sideEffects.find(effect => {
      const effectTime = parseDateTime(effect);
      return effectTime >= medTime && effectTime <= windowEnd;
    });

    if (effectInWindow) {
      correlationCount++;
    }
  }

  const confidence = correlationCount / totalDoses;
  const percentage = Math.round(confidence * 100);

  return {
    type: 'medication-effect',
    trigger: medicationName,
    effect: effectType,
    timeWindow: 6,
    timeWindowDescription: 'within 6 hours',
    confidence: Math.round(confidence * 100) / 100,
    frequency: `${correlationCount}/${totalDoses} doses`,
    occurrences: correlationCount,
    totalOpportunities: totalDoses,
    // PERSONALIZED LANGUAGE
    description: percentage > 50 
      ? `🔍 Your data suggests ${medicationName} may cause ${effectType} (${percentage}% of doses)`
      : `🔍 Your data suggests ${medicationName} may sometimes cause ${effectType} (${percentage}% of doses)`,
    recommendation: percentage > 30 
      ? `Consider discussing this pattern with your healthcare provider`
      : `Continue monitoring this potential side effect pattern`
  };
}

/**
 * Detect exercise → energy correlations
 */
async function detectExerciseEnergyCorrelations(timelineData, confidenceThreshold) {
  const correlations = [];
  
  const exerciseEntries = timelineData.filter(entry => entry.entry_type === 'exercise');
  const energyEntries = timelineData.filter(entry => entry.entry_type === 'energy');

  if (exerciseEntries.length === 0 || energyEntries.length === 0) {
    return correlations;
  }

  // Calculate baseline energy (when not exercising)
  const baselineEnergy = calculateBaselineEnergy(energyEntries, exerciseEntries);

  // Group exercises
  const exerciseGroups = {};
  for (const entry of exerciseEntries) {
    const exercise = entry.content.toLowerCase().trim();
    if (!exerciseGroups[exercise]) {
      exerciseGroups[exercise] = [];
    }
    exerciseGroups[exercise].push(entry);
  }

  // Analyze each exercise type
  for (const [exerciseType, exerciseInstances] of Object.entries(exerciseGroups)) {
    if (exerciseInstances.length < 2) continue;

    const correlation = analyzeExerciseEnergyCorrelation(
      exerciseInstances,
      energyEntries,
      exerciseType,
      baselineEnergy
    );

    if (Math.abs(correlation.energyChange) >= 1) { // At least 1 point change
      correlations.push(correlation);
    }
  }

  return correlations;
}

/**
 * Calculate baseline energy when not exercising
 */
function calculateBaselineEnergy(energyEntries, exerciseEntries) {
  const energyWithoutExercise = energyEntries.filter(energyEntry => {
    const energyDate = energyEntry.entry_date;
    const energyTime = energyEntry.entry_time;
    
    // Check if there was exercise on the same day before this energy reading
    const hadExercise = exerciseEntries.some(exerciseEntry => {
      return exerciseEntry.entry_date === energyDate && 
             exerciseEntry.entry_time <= energyTime;
    });
    
    return !hadExercise;
  });

  if (energyWithoutExercise.length === 0) return 5; // Default baseline

  return energyWithoutExercise.reduce((sum, entry) => sum + (entry.severity || 5), 0) / energyWithoutExercise.length;
}

/**
 * Analyze exercise → energy correlation with personalized language
 */
function analyzeExerciseEnergyCorrelation(exerciseInstances, energyEntries, exerciseType, baselineEnergy) {
  let postExerciseEnergies = [];
  let nextDayEnergies = [];

  for (const exercise of exerciseInstances) {
    const exerciseTime = parseDateTime(exercise);
    
    // Find energy within 4 hours after exercise
    const postEnergy = energyEntries.find(energy => {
      const energyTime = parseDateTime(energy);
      return energyTime > exerciseTime && 
             energyTime <= new Date(exerciseTime.getTime() + 4 * 60 * 60 * 1000);
    });
    
    if (postEnergy) {
      postExerciseEnergies.push(postEnergy.severity || 5);
    }

    // Find next day energy
    const nextDayEnergy = energyEntries.find(energy => {
      const energyDate = new Date(energy.entry_date);
      const exerciseDate = new Date(exercise.entry_date);
      const dayDiff = (energyDate - exerciseDate) / (1000 * 60 * 60 * 24);
      return dayDiff >= 0.5 && dayDiff <= 1.5; // Next day
    });
    
    if (nextDayEnergy) {
      nextDayEnergies.push(nextDayEnergy.severity || 5);
    }
  }

  const avgPostEnergy = postExerciseEnergies.length > 0 
    ? postExerciseEnergies.reduce((a, b) => a + b, 0) / postExerciseEnergies.length 
    : baselineEnergy;
    
  const avgNextDayEnergy = nextDayEnergies.length > 0 
    ? nextDayEnergies.reduce((a, b) => a + b, 0) / nextDayEnergies.length 
    : baselineEnergy;

  const immediateChange = avgPostEnergy - baselineEnergy;
  const nextDayChange = avgNextDayEnergy - baselineEnergy;
  const primaryChange = Math.abs(immediateChange) > Math.abs(nextDayChange) ? immediateChange : nextDayChange;

  return {
    type: 'exercise-energy',
    trigger: exerciseType,
    effect: primaryChange > 0 ? 'increased energy' : 'decreased energy',
    timeWindow: Math.abs(immediateChange) > Math.abs(nextDayChange) ? 4 : 24,
    timeWindowDescription: Math.abs(immediateChange) > Math.abs(nextDayChange) ? 'within 4 hours' : 'next day',
    confidence: Math.min(Math.abs(primaryChange) / 3, 1), // Confidence based on magnitude
    energyChange: Math.round(primaryChange * 10) / 10,
    baselineEnergy: Math.round(baselineEnergy * 10) / 10,
    sessionsAnalyzed: exerciseInstances.length,
    // PERSONALIZED LANGUAGE
    description: primaryChange > 1 
      ? `💡 Your data suggests ${exerciseType} consistently boosts energy levels (+${Math.round(primaryChange * 10) / 10} points above your baseline)`
      : primaryChange < -1 
      ? `🔍 Your data shows ${exerciseType} tends to reduce energy levels (${Math.round(primaryChange * 10) / 10} points below baseline)`
      : `🔍 Your ${exerciseType} sessions show minimal energy impact`,
    recommendation: primaryChange > 1 
      ? `Continue ${exerciseType} - it appears to energize you`
      : primaryChange < -1 
      ? `Consider adjusting ${exerciseType} intensity or timing to reduce fatigue`
      : `Monitor energy patterns to optimize ${exerciseType} timing`
  };
}

/**
 * FIXED: Detect sleep quality correlations - More lenient threshold
 */
async function detectSleepQualityCorrelations(timelineData, confidenceThreshold) {
  const correlations = [];
  
  const supplementEntries = timelineData.filter(entry => 
    entry.entry_type === 'supplement' && entry.entry_time >= '18:00:00'
  );
  const sleepEntries = timelineData.filter(entry => entry.entry_type === 'sleep');

  if (supplementEntries.length === 0 || sleepEntries.length === 0) {
    return correlations;
  }

  // Calculate baseline sleep quality
  const baselineSleep = sleepEntries.reduce((sum, entry) => sum + (entry.severity || 5), 0) / sleepEntries.length;

  // Group supplements
  const supplementGroups = {};
  for (const entry of supplementEntries) {
    const supplement = entry.content.toLowerCase().trim();
    if (!supplementGroups[supplement]) {
      supplementGroups[supplement] = [];
    }
    supplementGroups[supplement].push(entry);
  }

  // Analyze each supplement
  for (const [supplementName, supplementInstances] of Object.entries(supplementGroups)) {
    // FIXED: Changed from 3 to 2 minimum instances
    if (supplementInstances.length < 2) continue;

    const correlation = analyzeSupplementSleepCorrelation(
      supplementInstances,
      sleepEntries,
      supplementName,
      baselineSleep
    );

    if (Math.abs(correlation.sleepChange) >= 0.5) {
      correlations.push(correlation);
    }
  }

  return correlations;
}

/**
 * Analyze supplement → sleep correlation with personalized language
 */
function analyzeSupplementSleepCorrelation(supplementInstances, sleepEntries, supplementName, baselineSleep) {
  let sleepWithSupplement = [];

  for (const supplement of supplementInstances) {
    const nextDaySleep = sleepEntries.find(sleep => {
      const sleepDate = new Date(sleep.entry_date);
      const supplementDate = new Date(supplement.entry_date);
      const dayDiff = (sleepDate - supplementDate) / (1000 * 60 * 60 * 24);
      return dayDiff >= 0.5 && dayDiff <= 1.5; // Next night
    });
    
    if (nextDaySleep) {
      sleepWithSupplement.push(nextDaySleep.severity || 5);
    }
  }

  const avgSleepWithSupplement = sleepWithSupplement.length > 0 
    ? sleepWithSupplement.reduce((a, b) => a + b, 0) / sleepWithSupplement.length 
    : baselineSleep;

  const sleepChange = avgSleepWithSupplement - baselineSleep;
  const improvement = Math.round(((avgSleepWithSupplement - baselineSleep) / baselineSleep) * 100);

  return {
    type: 'sleep-quality',
    trigger: supplementName,
    effect: sleepChange > 0 ? 'improved sleep' : 'reduced sleep quality',
    timeWindow: 24,
    timeWindowDescription: 'next night',
    confidence: Math.min(Math.abs(sleepChange) / 2, 1),
    sleepChange: Math.round(sleepChange * 10) / 10,
    baselineSleep: Math.round(baselineSleep * 10) / 10,
    nightsAnalyzed: sleepWithSupplement.length,
    // PERSONALIZED LANGUAGE
    description: improvement > 20 
      ? `💡 Your data suggests ${supplementName} significantly improves sleep quality (${improvement}% better than baseline)`
      : improvement > 10 
      ? `💡 Your data suggests ${supplementName} may help with sleep quality (${improvement}% improvement)`
      : improvement < -10 
      ? `🔍 Your data suggests ${supplementName} may negatively affect sleep quality`
      : `🔍 Minimal sleep impact observed from ${supplementName}`,
    recommendation: improvement > 15 
      ? `Continue ${supplementName} - it appears to help your sleep`
      : improvement < -10 
      ? `Consider adjusting ${supplementName} timing or dosage`
      : `Monitor sleep patterns to optimize ${supplementName} effectiveness`
  };
}

/**
 * Detect stress → symptom amplification
 */
async function detectStressSymptomCorrelations(timelineData, confidenceThreshold) {
  const correlations = [];
  
  const stressEntries = timelineData.filter(entry => entry.entry_type === 'stress');
  const symptomEntries = timelineData.filter(entry => entry.entry_type === 'symptom');

  if (stressEntries.length === 0 || symptomEntries.length === 0) {
    return correlations;
  }

  for (const symptomType of getUniqueSymptoms(symptomEntries)) {
    const correlation = analyzeStressSymptomCorrelation(
      stressEntries,
      symptomEntries.filter(s => s.content === symptomType),
      symptomType
    );

    if (correlation.stressAmplification > 1) {
      correlations.push(correlation);
    }
  }

  return correlations;
}

/**
 * Analyze stress → symptom amplification with personalized language
 */
function analyzeStressSymptomCorrelation(stressEntries, symptoms, symptomType) {
  let highStressSymptoms = [];
  let lowStressSymptoms = [];

  for (const symptom of symptoms) {
    const symptomDate = symptom.entry_date;
    const dayStress = stressEntries.filter(stress => stress.entry_date === symptomDate);
    
    if (dayStress.length > 0) {
      const avgDayStress = dayStress.reduce((sum, s) => sum + (s.severity || 5), 0) / dayStress.length;
      
      if (avgDayStress >= 7) {
        highStressSymptoms.push(symptom.severity || 5);
      } else if (avgDayStress <= 4) {
        lowStressSymptoms.push(symptom.severity || 5);
      }
    }
  }

  const avgHighStressSeverity = highStressSymptoms.length > 0 
    ? highStressSymptoms.reduce((a, b) => a + b, 0) / highStressSymptoms.length 
    : 0;
    
  const avgLowStressSeverity = lowStressSymptoms.length > 0 
    ? lowStressSymptoms.reduce((a, b) => a + b, 0) / lowStressSymptoms.length 
    : 0;

  const stressAmplification = avgLowStressSeverity > 0 ? avgHighStressSeverity / avgLowStressSeverity : 1;
  const amplificationPercent = Math.round((stressAmplification - 1) * 100);

  return {
    type: 'stress-symptom',
    trigger: 'high stress',
    effect: symptomType,
    timeWindow: 24,
    timeWindowDescription: 'same day',
    confidence: Math.min(stressAmplification / 2, 1),
    stressAmplification: Math.round(stressAmplification * 100) / 100,
    highStressOccurrences: highStressSymptoms.length,
    lowStressOccurrences: lowStressSymptoms.length,
    // PERSONALIZED LANGUAGE
    description: amplificationPercent > 50 
      ? `🔍 Your data shows high stress days significantly worsen ${symptomType} (${amplificationPercent}% more severe)`
      : amplificationPercent > 20 
      ? `🔍 Your data shows stress tends to amplify ${symptomType} symptoms (${amplificationPercent}% increase)`
      : `🔍 Minimal stress impact observed on ${symptomType}`,
    recommendation: amplificationPercent > 30 
      ? `Focus on stress management to help control ${symptomType}`
      : `Continue monitoring stress levels and ${symptomType} patterns`
  };
}

/**
 * FIXED: Enhanced supplement improvement detection - More lenient threshold
 */
async function detectSupplementImprovements(timelineData, confidenceThreshold) {
  const correlations = [];
  
  const supplementEntries = timelineData.filter(entry => entry.entry_type === 'supplement');
  const symptomEntries = timelineData.filter(entry => entry.entry_type === 'symptom');

  if (supplementEntries.length === 0 || symptomEntries.length === 0) {
    return correlations;
  }

  const supplementGroups = {};
  for (const entry of supplementEntries) {
    const supplement = entry.content.toLowerCase().trim();
    if (!supplementGroups[supplement]) {
      supplementGroups[supplement] = [];
    }
    supplementGroups[supplement].push(entry);
  }

  for (const [supplementName, supplementInstances] of Object.entries(supplementGroups)) {
    // FIXED: Changed from 7 to 5 minimum instances for more data
    if (supplementInstances.length < 5) continue;

    const startDate = new Date(Math.min(...supplementInstances.map(s => parseDateTime(s).getTime())));
    
    for (const symptomType of getUniqueSymptoms(symptomEntries)) {
      const correlation = analyzePersonalizedSupplementImprovement(
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
 * Analyze supplement improvement with personalized language
 */
function analyzePersonalizedSupplementImprovement(supplementInstances, symptoms, startDate, supplementName, symptomType) {
  const fourWeeksBefore = new Date(startDate.getTime() - 28 * 24 * 60 * 60 * 1000);
  const fourWeeksAfter = new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000);

  const symptomsBefore = symptoms.filter(s => {
    const sympTime = parseDateTime(s);
    return sympTime >= fourWeeksBefore && sympTime < startDate;
  });

  const symptomsAfter = symptoms.filter(s => {
    const sympTime = parseDateTime(s);
    return sympTime >= startDate && sympTime <= fourWeeksAfter;
  });

  if (symptomsBefore.length === 0 && symptomsAfter.length === 0) {
    return { confidence: 0 };
  }

  const avgSeverityBefore = symptomsBefore.length > 0 ? 
    symptomsBefore.reduce((sum, s) => sum + (s.severity || 0), 0) / symptomsBefore.length : 0;
  
  const avgSeverityAfter = symptomsAfter.length > 0 ? 
    symptomsAfter.reduce((sum, s) => sum + (s.severity || 0), 0) / symptomsAfter.length : 0;

  const frequencyBefore = symptomsBefore.length / 28;
  const frequencyAfter = symptomsAfter.length / 28;

  const severityImprovement = avgSeverityBefore > 0 ? (avgSeverityBefore - avgSeverityAfter) / avgSeverityBefore : 0;
  const frequencyImprovement = frequencyBefore > 0 ? (frequencyBefore - frequencyAfter) / frequencyBefore : 0;

  const confidence = Math.max(severityImprovement, frequencyImprovement);
  const improvementPercent = Math.round(confidence * 100);

  if (confidence <= 0) {
    return { confidence: 0 };
  }

  return {
    type: 'supplement-improvement',
    trigger: supplementName,
    effect: `reduced ${symptomType}`,
    timeWindow: 28 * 24,
    timeWindowDescription: 'after 4 weeks',
    confidence: Math.round(confidence * 100) / 100,
    frequency: `${Math.round(frequencyImprovement * 100)}% reduction in frequency`,
    severityChange: `${Math.round(severityImprovement * 100)}% reduction in severity`,
    // PERSONALIZED LANGUAGE
    description: improvementPercent > 50 
      ? `💡 Your data suggests ${supplementName} significantly reduces ${symptomType} (${improvementPercent}% improvement after 4 weeks)`
      : improvementPercent > 25 
      ? `💡 Your data suggests ${supplementName} may help with ${symptomType} (${improvementPercent}% improvement)`
      : `💡 Possible benefit: ${supplementName} for ${symptomType} (${improvementPercent}% improvement)`,
    recommendation: improvementPercent > 40 
      ? `Continue ${supplementName} - your data shows positive effects on ${symptomType}`
      : improvementPercent > 20 
      ? `Consider continuing ${supplementName} while monitoring ${symptomType} patterns`
      : `Monitor ${supplementName} effects over a longer period for clearer patterns`
  };
}

/**
 * Helper function to safely parse date and time
 */
function parseDateTime(entry) {
  let dateStr;
  
  if (entry.entry_date instanceof Date) {
    dateStr = entry.entry_date.toISOString().split('T')[0];
  } else {
    dateStr = entry.entry_date;
  }
  
  return new Date(`${dateStr}T${entry.entry_time}`);
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
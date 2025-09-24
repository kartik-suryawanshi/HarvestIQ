// Mock agricultural data for different scenarios

export interface SoilProfile {
  type: string; // e.g., Loam, Clay Loam, Sandy Loam
  ph: number; // e.g., 6.5
  organicMatterPct: number; // percent
  drainage: 'poor' | 'moderate' | 'good';
}

export interface ForecastData {
  currentWeather: {
    temperature: number;
    humidity: number;
    conditions: string;
  };
  riskAssessment: {
    level: number;
    reason: string;
  };
  weatherTrend: Array<{
    day: string;
    rainfall: number;
    temperature: number;
  }>;
  weeklyForecast: Array<{
    day: string;
    temp: number;
    rain: number;
    conditionIcon?: string; // Add optional condition icon
  }>;
  yieldPrediction: {
    value: string;
    confidence: number;
    vsHistorical: number;
  };
  featureImportance: Array<{
    name: string;
    impact: number;
  }>;
  explanation: string;
  irrigationSchedule: Array<{
    week: string;
    action: string;
    amount?: string;
    reason: string;
  }>;
  waterSavings: number;
  soilProfile: SoilProfile;
}

const generateWeatherTrend = (baseRainfall: number, variation: number) => {
  return Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    rainfall: Math.max(0, baseRainfall + Math.random() * variation - variation / 2),
    temperature: 28 + Math.random() * 8
  }));
};

const generateWeeklyForecast = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    temp: Math.round(25 + Math.random() * 10),
    rain: Math.round(Math.random() * 15),
    conditionIcon: '01d' // Placeholder icon
  }));
};

export const mockForecastData: Record<string, Record<string, ForecastData>> = {
  normal: {
    'rice': {
      currentWeather: {
        temperature: 32,
        humidity: 78,
        conditions: 'Partly Cloudy'
      },
      riskAssessment: {
        level: 25,
        reason: 'Favorable conditions with adequate rainfall expected. Minimal risk for current season.'
      },
      weatherTrend: generateWeatherTrend(8, 6),
      weeklyForecast: generateWeeklyForecast(),
      yieldPrediction: {
        value: '4.2',
        confidence: 87,
        vsHistorical: 8
      },
      featureImportance: [
        { name: 'Rainfall', impact: 42 },
        { name: 'Temperature', impact: 25 },
        { name: 'NDVI', impact: 18 },
        { name: 'Soil', impact: 15 }
      ],
      explanation: 'Expected rainfall is favorable for rice cultivation. Optimal temperature range maintained throughout growing season.',
      irrigationSchedule: [
        { week: 'Week 1-2', action: 'Skip', reason: 'Natural rainfall sufficient' },
        { week: 'Week 3-4', action: 'Irrigate', amount: '50', reason: 'Supplement for tillering stage' },
        { week: 'Week 5-6', action: 'Irrigate', amount: '75', reason: 'Critical flowering period' },
        { week: 'Week 7-8', action: 'Skip', reason: 'Expected monsoon rains' }
      ],
      waterSavings: 23,
      soilProfile: { type: 'Clay Loam', ph: 6.4, organicMatterPct: 2.1, drainage: 'moderate' }
    },
    'wheat': {
      currentWeather: {
        temperature: 24,
        humidity: 65,
        conditions: 'Clear'
      },
      riskAssessment: {
        level: 18,
        reason: 'Excellent conditions for wheat cultivation. Cool temperatures favor grain development.'
      },
      weatherTrend: generateWeatherTrend(5, 4),
      weeklyForecast: generateWeeklyForecast(),
      yieldPrediction: {
        value: '3.8',
        confidence: 92,
        vsHistorical: 12
      },
      featureImportance: [
        { name: 'Temperature', impact: 38 },
        { name: 'Rainfall', impact: 28 },
        { name: 'Soil', impact: 22 },
        { name: 'NDVI', impact: 12 }
      ],
      explanation: 'Cool winter temperatures are optimal for wheat. Limited irrigation needed due to winter rains.',
      irrigationSchedule: [
        { week: 'Week 1-2', action: 'Irrigate', amount: '40', reason: 'Crown root irrigation' },
        { week: 'Week 3-4', action: 'Skip', reason: 'Winter rainfall expected' },
        { week: 'Week 5-6', action: 'Irrigate', amount: '45', reason: 'Pre-flowering support' },
        { week: 'Week 7-8', action: 'Skip', reason: 'Natural moisture sufficient' }
      ],
      waterSavings: 31,
      soilProfile: { type: 'Loam', ph: 6.8, organicMatterPct: 1.8, drainage: 'good' }
    },
    'maize': {
      currentWeather: {
        temperature: 29,
        humidity: 72,
        conditions: 'Overcast'
      },
      riskAssessment: {
        level: 22,
        reason: 'Good conditions for maize growth. Adequate moisture and moderate temperatures.'
      },
      weatherTrend: generateWeatherTrend(12, 8),
      weeklyForecast: generateWeeklyForecast(),
      yieldPrediction: {
        value: '5.1',
        confidence: 84,
        vsHistorical: 6
      },
      featureImportance: [
        { name: 'Rainfall', impact: 35 },
        { name: 'Temperature', impact: 30 },
        { name: 'Soil', impact: 20 },
        { name: 'NDVI', impact: 15 }
      ],
      explanation: 'Maize requires consistent moisture. Current weather patterns support healthy growth.',
      irrigationSchedule: [
        { week: 'Week 1-2', action: 'Irrigate', amount: '35', reason: 'Germination support' },
        { week: 'Week 3-4', action: 'Skip', reason: 'Monsoon onset expected' },
        { week: 'Week 5-6', action: 'Irrigate', amount: '60', reason: 'Tasseling stage' },
        { week: 'Week 7-8', action: 'Skip', reason: 'Natural precipitation' }
      ],
      waterSavings: 18,
      soilProfile: { type: 'Sandy Loam', ph: 6.2, organicMatterPct: 1.5, drainage: 'good' }
    },
    'sugarcane': {
      currentWeather: {
        temperature: 35,
        humidity: 83,
        conditions: 'Humid'
      },
      riskAssessment: {
        level: 28,
        reason: 'High temperatures but adequate humidity. Monitor for heat stress in peak summer.'
      },
      weatherTrend: generateWeatherTrend(15, 10),
      weeklyForecast: generateWeeklyForecast(),
      yieldPrediction: {
        value: '68',
        confidence: 79,
        vsHistorical: 4
      },
      featureImportance: [
        { name: 'Rainfall', impact: 45 },
        { name: 'Temperature', impact: 30 },
        { name: 'Soil', impact: 15 },
        { name: 'NDVI', impact: 10 }
      ],
      explanation: 'Sugarcane requires heavy irrigation in dry periods. High water demand crop.',
      irrigationSchedule: [
        { week: 'Week 1-2', action: 'Irrigate', amount: '80', reason: 'Establishment phase' },
        { week: 'Week 3-4', action: 'Irrigate', amount: '90', reason: 'Rapid growth phase' },
        { week: 'Week 5-6', action: 'Skip', reason: 'Monsoon rains' },
        { week: 'Week 7-8', action: 'Irrigate', amount: '70', reason: 'Maturation support' }
      ],
      waterSavings: 12,
      soilProfile: { type: 'Loam to Clay Loam', ph: 6.5, organicMatterPct: 2.0, drainage: 'moderate' }
    }
  },
  drought: {
    'rice': {
      currentWeather: {
        temperature: 38,
        humidity: 45,
        conditions: 'Hot & Dry'
      },
      riskAssessment: {
        level: 75,
        reason: 'Severe drought conditions. High temperature and low rainfall pose significant risks.'
      },
      weatherTrend: generateWeatherTrend(2, 3),
      weeklyForecast: generateWeeklyForecast(),
      yieldPrediction: {
        value: '2.8',
        confidence: 68,
        vsHistorical: -28
      },
      featureImportance: [
        { name: 'Rainfall', impact: 55 },
        { name: 'Temperature', impact: 35 },
        { name: 'Soil', impact: 8 },
        { name: 'NDVI', impact: 2 }
      ],
      explanation: 'Critical drought conditions. Immediate irrigation required to prevent crop failure.',
      irrigationSchedule: [
        { week: 'Week 1-2', action: 'Irrigate', amount: '90', reason: 'Emergency irrigation needed' },
        { week: 'Week 3-4', action: 'Irrigate', amount: '85', reason: 'Prevent wilting' },
        { week: 'Week 5-6', action: 'Irrigate', amount: '80', reason: 'Sustain plant health' },
        { week: 'Week 7-8', action: 'Irrigate', amount: '75', reason: 'Recovery irrigation' }
      ],
      waterSavings: -45,
      soilProfile: { type: 'Clay', ph: 6.7, organicMatterPct: 1.9, drainage: 'poor' }
    },
    'maize': {
      currentWeather: {
        temperature: 41,
        humidity: 32,
        conditions: 'Extreme Heat'
      },
      riskAssessment: {
        level: 82,
        reason: 'Extreme drought alert. Crop survival at risk without immediate intervention.'
      },
      weatherTrend: generateWeatherTrend(1, 2),
      weeklyForecast: generateWeeklyForecast(),
      yieldPrediction: {
        value: '2.1',
        confidence: 58,
        vsHistorical: -45
      },
      featureImportance: [
        { name: 'Rainfall', impact: 65 },
        { name: 'Temperature', impact: 25 },
        { name: 'Soil', impact: 7 },
        { name: 'NDVI', impact: 3 }
      ],
      explanation: 'Extreme heat stress conditions. Consider drought-resistant varieties for next season.',
      irrigationSchedule: [
        { week: 'Week 1-2', action: 'Irrigate', amount: '100', reason: 'Critical survival irrigation' },
        { week: 'Week 3-4', action: 'Irrigate', amount: '95', reason: 'Heat stress mitigation' },
        { week: 'Week 5-6', action: 'Irrigate', amount: '90', reason: 'Maintain plant viability' },
        { week: 'Week 7-8', action: 'Irrigate', amount: '85', reason: 'Recovery support' }
      ],
      waterSavings: -60,
      soilProfile: { type: 'Sandy', ph: 6.1, organicMatterPct: 0.9, drainage: 'good' }
    }
  },
  wet: {
    'rice': {
      currentWeather: {
        temperature: 26,
        humidity: 95,
        conditions: 'Heavy Rain'
      },
      riskAssessment: {
        level: 45,
        reason: 'Excess rainfall may cause waterlogging. Monitor for fungal diseases.'
      },
      weatherTrend: generateWeatherTrend(25, 15),
      weeklyForecast: generateWeeklyForecast(),
      yieldPrediction: {
        value: '4.8',
        confidence: 76,
        vsHistorical: 15
      },
      featureImportance: [
        { name: 'Rainfall', impact: 30 },
        { name: 'Disease', impact: 35 },
        { name: 'Temperature', impact: 20 },
        { name: 'NDVI', impact: 15 }
      ],
      explanation: 'Abundant rainfall benefits rice but requires drainage management to prevent diseases.',
      irrigationSchedule: [
        { week: 'Week 1-2', action: 'Skip', reason: 'Excessive natural rainfall' },
        { week: 'Week 3-4', action: 'Skip', reason: 'Soil saturated' },
        { week: 'Week 5-6', action: 'Skip', reason: 'Continued heavy rains' },
        { week: 'Week 7-8', action: 'Skip', reason: 'Natural water sufficient' }
      ],
      waterSavings: 85,
      soilProfile: { type: 'Clay', ph: 6.3, organicMatterPct: 2.4, drainage: 'poor' }
    }
  }
};

export const generateForecast = (
  district: string,
  crop: string,
  season: string,
  scenario: string,
  soilType: string,
  soilPH: string,
  organicMatter: string,
  drainage: string
): ForecastData => {
  const scenarioData = mockForecastData[scenario] || mockForecastData.normal;
  const cropData = scenarioData[crop] || scenarioData.normal.rice;
  
  return {
    ...cropData,
    // Add some randomization to make it feel more dynamic
    yieldPrediction: {
      ...cropData.yieldPrediction,
      confidence: Math.max(50, Math.min(95, cropData.yieldPrediction.confidence + Math.random() * 10 - 5))
    },
    soilProfile: {
      type: soilType as SoilProfile['type'],
      ph: parseFloat(soilPH),
      organicMatterPct: parseFloat(organicMatter),
      drainage: drainage as SoilProfile['drainage'],
    }
  };
};

export const mockApiCall = (
  district: string,
  crop: string,
  season: string,
  scenario: string,
  soilType: string,
  soilPH: string,
  organicMatter: string,
  drainage: string
): Promise<ForecastData> => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      resolve(generateForecast(district, crop, season, scenario, soilType, soilPH, organicMatter, drainage));
    }, 2000 + Math.random() * 1000); // 2-3 second delay
  });
};
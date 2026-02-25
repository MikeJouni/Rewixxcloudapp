import config from '../../../config';

const API_BASE = config.SPRING_API_BASE;

export const reportService = {
  // Get revenue report
  getRevenueReport: async (startDate, endDate) => {
    const response = await fetch(`${API_BASE}/api/reports/revenue?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      throw new Error('Failed to fetch revenue report');
    }
    return response.json();
  },

  // Get labor report
  getLaborReport: async (startDate, endDate) => {
    const response = await fetch(`${API_BASE}/api/reports/labor?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      throw new Error('Failed to fetch labor report');
    }
    return response.json();
  },

  // Get expenses report
  getExpensesReport: async (startDate, endDate) => {
    const response = await fetch(`${API_BASE}/api/reports/expenses?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      throw new Error('Failed to fetch expenses report');
    }
    return response.json();
  },

  // Get business insights report
  getBusinessInsightsReport: async (startDate, endDate) => {
    const response = await fetch(`${API_BASE}/api/reports/insights?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      throw new Error('Failed to fetch business insights report');
    }
    return response.json();
  },

  // Get comprehensive report
  getComprehensiveReport: async (startDate, endDate) => {
    const response = await fetch(`${API_BASE}/api/reports/comprehensive?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      throw new Error('Failed to fetch comprehensive report');
    }
    return response.json();
  }
};


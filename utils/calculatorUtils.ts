/**
 * Investment Calculator Utility Functions
 * Provides various financial calculations for investment returns
 */

export interface InvestmentResult {
  futureValue: number;
  totalInterest: number;
  totalInvestment: number;
  monthlyBreakdown?: MonthlyBreakdown[];
}

export interface MonthlyBreakdown {
  month: number;
  balance: number;
  interestEarned: number;
  totalInterest: number;
}

export interface SIPResult {
  futureValue: number;
  totalInvestment: number;
  totalInterest: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

/**
 * Calculate compound interest returns for a lump sum investment
 * Formula: A = P(1 + r/n)^(nt)
 * 
 * @param principal - Initial investment amount
 * @param annualRate - Annual interest rate (as percentage, e.g., 8 for 8%)
 * @param years - Investment period in years
 * @param compoundingFrequency - How many times interest is compounded per year
 * @returns Investment result with future value and interest earned
 */
export const calculateInvestmentReturns = (
  principal: number,
  annualRate: number,
  years: number,
  compoundingFrequency: number = 12
): InvestmentResult => {
  if (principal <= 0 || annualRate <= 0 || years <= 0) {
    throw new Error('All values must be positive numbers');
  }

  const rate = annualRate / 100; // Convert percentage to decimal
  const n = compoundingFrequency;
  const t = years;

  // Compound interest formula: A = P(1 + r/n)^(nt)
  const futureValue = principal * Math.pow(1 + rate / n, n * t);
  const totalInterest = futureValue - principal;

  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalInvestment: principal,
  };
};

/**
 * Calculate simple interest returns
 * Formula: A = P(1 + rt)
 * 
 * @param principal - Initial investment amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param years - Investment period in years
 * @returns Investment result with future value and interest earned
 */
export const calculateSimpleInterest = (
  principal: number,
  annualRate: number,
  years: number
): InvestmentResult => {
  if (principal <= 0 || annualRate <= 0 || years <= 0) {
    throw new Error('All values must be positive numbers');
  }

  const rate = annualRate / 100;
  const futureValue = principal * (1 + rate * years);
  const totalInterest = futureValue - principal;

  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalInvestment: principal,
  };
};

/**
 * Calculate Systematic Investment Plan (SIP) returns
 * Formula for monthly SIP: FV = PMT × [(1 + r)^n - 1] / r × (1 + r)
 * 
 * @param monthlyInvestment - Monthly investment amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param years - Investment period in years
 * @param withBreakdown - Whether to include monthly breakdown
 * @returns SIP investment result
 */
export const calculateSIPReturns = (
  monthlyInvestment: number,
  annualRate: number,
  years: number,
  withBreakdown: boolean = false
): SIPResult => {
  if (monthlyInvestment <= 0 || annualRate <= 0 || years <= 0) {
    throw new Error('All values must be positive numbers');
  }

  const monthlyRate = annualRate / 100 / 12; // Monthly interest rate
  const totalMonths = years * 12;
  const totalInvestment = monthlyInvestment * totalMonths;

  let futureValue = 0;
  const monthlyBreakdown: MonthlyBreakdown[] = [];
  let runningBalance = 0;
  let totalInterestEarned = 0;

  // Calculate month by month for accurate results
  for (let month = 1; month <= totalMonths; month++) {
    // Add monthly investment
    runningBalance += monthlyInvestment;
    
    // Apply interest to the balance
    const monthlyInterest = runningBalance * monthlyRate;
    runningBalance += monthlyInterest;
    totalInterestEarned += monthlyInterest;

    if (withBreakdown) {
      monthlyBreakdown.push({
        month,
        balance: Math.round(runningBalance * 100) / 100,
        interestEarned: Math.round(monthlyInterest * 100) / 100,
        totalInterest: Math.round(totalInterestEarned * 100) / 100,
      });
    }
  }

  futureValue = runningBalance;

  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalInvestment: totalInvestment,
    totalInterest: Math.round(totalInterestEarned * 100) / 100,
    monthlyBreakdown: monthlyBreakdown,
  };
};

/**
 * Calculate the monthly investment needed to reach a target amount
 * 
 * @param targetAmount - Desired future value
 * @param annualRate - Annual interest rate (as percentage)
 * @param years - Investment period in years
 * @returns Required monthly investment amount
 */
export const calculateRequiredMonthlyInvestment = (
  targetAmount: number,
  annualRate: number,
  years: number
): number => {
  if (targetAmount <= 0 || annualRate <= 0 || years <= 0) {
    throw new Error('All values must be positive numbers');
  }

  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;

  // PMT = FV × r / [(1 + r)^n - 1] / (1 + r)
  const monthlyInvestment = 
    (targetAmount * monthlyRate) / 
    (Math.pow(1 + monthlyRate, totalMonths) - 1) /
    (1 + monthlyRate);

  return Math.round(monthlyInvestment * 100) / 100;
};

/**
 * Calculate break-even time for an investment
 * 
 * @param principal - Initial investment
 * @param annualRate - Annual interest rate (as percentage)
 * @param targetMultiplier - Target multiple (e.g., 2 for doubling)
 * @param compoundingFrequency - Compounding frequency per year
 * @returns Time in years to reach the target
 */
export const calculateBreakEvenTime = (
  principal: number,
  annualRate: number,
  targetMultiplier: number = 2,
  compoundingFrequency: number = 12
): number => {
  if (principal <= 0 || annualRate <= 0 || targetMultiplier <= 1) {
    throw new Error('Invalid input values');
  }

  const rate = annualRate / 100;
  const targetAmount = principal * targetMultiplier;

  // Using logarithms to solve for time: t = ln(A/P) / (n × ln(1 + r/n))
  const time = Math.log(targetAmount / principal) / 
               (compoundingFrequency * Math.log(1 + rate / compoundingFrequency));

  return Math.round(time * 100) / 100;
};

/**
 * Calculate real returns considering inflation
 * 
 * @param nominalRate - Nominal annual return rate (as percentage)
 * @param inflationRate - Annual inflation rate (as percentage)
 * @returns Real return rate (as percentage)
 */
export const calculateRealReturns = (
  nominalRate: number,
  inflationRate: number
): number => {
  // Real rate = (1 + nominal rate) / (1 + inflation rate) - 1
  const realRate = ((1 + nominalRate / 100) / (1 + inflationRate / 100) - 1) * 100;
  
  return Math.round(realRate * 100) / 100;
};

/**
 * Calculate portfolio diversification metrics
 * 
 * @param investments - Array of investment amounts
 * @param returns - Array of expected returns for each investment
 * @returns Portfolio metrics including weighted average return
 */
export const calculatePortfolioMetrics = (
  investments: number[],
  returns: number[]
): {
  totalInvestment: number;
  weightedAverageReturn: number;
  weights: number[];
} => {
  if (investments.length !== returns.length) {
    throw new Error('Investments and returns arrays must have the same length');
  }

  const totalInvestment = investments.reduce((sum, amount) => sum + amount, 0);
  
  if (totalInvestment <= 0) {
    throw new Error('Total investment must be positive');
  }

  const weights = investments.map(amount => amount / totalInvestment);
  const weightedAverageReturn = weights.reduce(
    (sum, weight, index) => sum + (weight * returns[index]), 
    0
  );

  return {
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    weightedAverageReturn: Math.round(weightedAverageReturn * 100) / 100,
    weights: weights.map(w => Math.round(w * 10000) / 100), // Convert to percentages
  };
};

/**
 * Format currency for display
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format percentage for display
 * 
 * @param rate - Rate to format (as decimal or percentage)
 * @param asDecimal - Whether the input is already a decimal
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  rate: number,
  asDecimal: boolean = false
): string => {
  const percentage = asDecimal ? rate * 100 : rate;
  return `${percentage.toFixed(2)}%`;
};

/**
 * Validate investment input parameters
 * 
 * @param principal - Investment amount
 * @param rate - Interest rate
 * @param time - Time period
 * @returns Validation result
 */
export const validateInvestmentInputs = (
  principal: number,
  rate: number,
  time: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (isNaN(principal) || principal <= 0) {
    errors.push('Principal amount must be a positive number');
  }

  if (isNaN(rate) || rate <= 0) {
    errors.push('Interest rate must be a positive number');
  }

  if (isNaN(time) || time <= 0) {
    errors.push('Time period must be a positive number');
  }

  if (rate > 50) {
    errors.push('Interest rate seems unusually high (>50%)');
  }

  if (time > 100) {
    errors.push('Time period seems unusually long (>100 years)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
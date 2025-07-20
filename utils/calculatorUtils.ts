/**
 * Advanced Investment Calculator Utility Functions
 * Comprehensive financial calculations for various investment types
 */

export interface InvestmentResult {
  futureValue: number;
  totalInterest: number;
  totalInvestment: number;
  monthlyAmount?: number;
  maturityAmount?: number;
  totalEMI?: number;
  monthlyBreakdown?: MonthlyBreakdown[];
}

export interface MonthlyBreakdown {
  month: number;
  balance: number;
  interestEarned: number;
  totalInterest: number;
  principalPaid?: number;
  interestPaid?: number;
  remainingBalance?: number;
}

export interface SIPResult extends InvestmentResult {
  monthlyBreakdown: MonthlyBreakdown[];
}

export interface EMIResult extends InvestmentResult {
  monthlyEMI: number;
  totalAmount: number;
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
): InvestmentResult => {
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
 * Calculate Fixed Deposit (FD) returns
 * Similar to compound interest but with specific bank terms
 * 
 * @param principal - Initial deposit amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param years - FD tenure in years
 * @param compoundingFrequency - Compounding frequency (quarterly is common for FDs)
 * @returns FD maturity calculation
 */
export const calculateFDReturns = (
  principal: number,
  annualRate: number,
  years: number,
  compoundingFrequency: number = 4 // Quarterly compounding for FDs
): InvestmentResult => {
  if (principal <= 0 || annualRate <= 0 || years <= 0) {
    throw new Error('All values must be positive numbers');
  }

  const rate = annualRate / 100;
  const n = compoundingFrequency;
  const t = years;

  // FD compound interest formula
  const maturityAmount = principal * Math.pow(1 + rate / n, n * t);
  const totalInterest = maturityAmount - principal;

  return {
    futureValue: Math.round(maturityAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalInvestment: principal,
    maturityAmount: Math.round(maturityAmount * 100) / 100,
  };
};

/**
 * Calculate Public Provident Fund (PPF) returns
 * PPF has specific rules: 15-year lock-in, current rate ~7.1%, tax benefits
 * 
 * @param monthlyInvestment - Monthly investment (max ₹1,50,000 per year)
 * @param years - Investment period (minimum 15 years)
 * @returns PPF calculation with tax benefits consideration
 */
export const calculatePPFReturns = (
  monthlyInvestment: number,
  years: number = 15
): InvestmentResult => {
  if (monthlyInvestment <= 0) {
    throw new Error('Monthly investment must be positive');
  }

  const annualInvestment = monthlyInvestment * 12;
  const maxAnnualLimit = 150000; // PPF annual limit

  if (annualInvestment > maxAnnualLimit) {
    throw new Error(`Annual PPF investment cannot exceed ₹${maxAnnualLimit.toLocaleString()}`);
  }

  const ppfRate = 7.1; // Current PPF rate (government decides annually)
  const minTenure = 15; // Minimum PPF lock-in period
  
  const actualYears = Math.max(years, minTenure);
  const monthlyRate = ppfRate / 100 / 12;
  const totalMonths = actualYears * 12;
  const totalInvestment = monthlyInvestment * totalMonths;

  let futureValue = 0;
  let runningBalance = 0;
  let totalInterestEarned = 0;

  // Calculate PPF compound interest (monthly compounding)
  for (let month = 1; month <= totalMonths; month++) {
    runningBalance += monthlyInvestment;
    const monthlyInterest = runningBalance * monthlyRate;
    runningBalance += monthlyInterest;
    totalInterestEarned += monthlyInterest;
  }

  futureValue = runningBalance;

  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalInvestment: totalInvestment,
    totalInterest: Math.round(totalInterestEarned * 100) / 100,
  };
};

/**
 * Calculate goal-based SIP requirement
 * Determines how much monthly SIP is needed to reach a target amount
 * 
 * @param targetAmount - Desired future value
 * @param annualRate - Expected annual return rate (as percentage)
 * @param years - Time period to achieve the goal
 * @returns Required monthly SIP and total investment
 */
export const calculateGoalBasedSIP = (
  targetAmount: number,
  annualRate: number,
  years: number
): InvestmentResult => {
  if (targetAmount <= 0 || annualRate <= 0 || years <= 0) {
    throw new Error('All values must be positive numbers');
  }

  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;

  // Formula to calculate required monthly SIP
  // PMT = FV × r / [(1 + r)^n - 1]
  const requiredMonthlySIP = 
    (targetAmount * monthlyRate) / 
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const totalInvestment = requiredMonthlySIP * totalMonths;
  const totalInterest = targetAmount - totalInvestment;

  return {
    futureValue: targetAmount,
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    monthlyAmount: Math.round(requiredMonthlySIP * 100) / 100,
  };
};

/**
 * Calculate EMI for loans (Home, Car, Personal)
 * Formula: EMI = P × r × (1 + r)^n / [(1 + r)^n - 1]
 * 
 * @param loanAmount - Principal loan amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param years - Loan tenure in years
 * @param withBreakdown - Whether to include month-wise amortization
 * @returns EMI calculation with total cost breakdown
 */
export const calculateEMI = (
  loanAmount: number,
  annualRate: number,
  years: number,
  withBreakdown: boolean = false
): InvestmentResult => {
  if (loanAmount <= 0 || annualRate <= 0 || years <= 0) {
    throw new Error('All values must be positive numbers');
  }

  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;

  // EMI formula: EMI = P × r × (1 + r)^n / [(1 + r)^n - 1]
  const emi = 
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const totalAmount = emi * totalMonths;
  const totalInterest = totalAmount - loanAmount;

  const monthlyBreakdown: MonthlyBreakdown[] = [];

  if (withBreakdown) {
    let remainingBalance = loanAmount;

    for (let month = 1; month <= totalMonths; month++) {
      const interestPaid = remainingBalance * monthlyRate;
      const principalPaid = emi - interestPaid;
      remainingBalance -= principalPaid;

      monthlyBreakdown.push({
        month,
        balance: Math.round(remainingBalance * 100) / 100,
        interestEarned: Math.round(interestPaid * 100) / 100,
        totalInterest: 0, // Will calculate cumulative if needed
        principalPaid: Math.round(principalPaid * 100) / 100,
        interestPaid: Math.round(interestPaid * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100,
      });
    }
  }

  return {
    futureValue: Math.round(totalAmount * 100) / 100,
    totalInvestment: loanAmount,
    totalInterest: Math.round(totalInterest * 100) / 100,
    monthlyAmount: Math.round(emi * 100) / 100,
    totalEMI: Math.round(totalAmount * 100) / 100,
    monthlyBreakdown,
  };
};

/**
 * Calculate Mutual Fund SIP with expense ratio
 * 
 * @param monthlyInvestment - Monthly SIP amount
 * @param annualRate - Expected annual return (as percentage)
 * @param years - Investment period
 * @param expenseRatio - Annual expense ratio (as percentage, e.g., 1.5)
 * @returns Mutual fund SIP calculation considering fees
 */
export const calculateMutualFundSIP = (
  monthlyInvestment: number,
  annualRate: number,
  years: number,
  expenseRatio: number = 1.5
): InvestmentResult => {
  if (monthlyInvestment <= 0 || annualRate <= 0 || years <= 0) {
    throw new Error('All values must be positive numbers');
  }

  // Adjust return rate for expense ratio
  const netAnnualRate = annualRate - expenseRatio;
  
  if (netAnnualRate <= 0) {
    throw new Error('Expense ratio cannot be higher than expected returns');
  }

  return calculateSIPReturns(monthlyInvestment, netAnnualRate, years);
};

/**
 * Calculate retirement corpus requirement using inflation adjustment
 * 
 * @param currentAge - Current age
 * @param retirementAge - Planned retirement age
 * @param monthlyExpenses - Current monthly expenses
 * @param inflationRate - Expected inflation rate (as percentage)
 * @param expectedReturn - Expected portfolio return (as percentage)
 * @returns Required retirement corpus and monthly SIP
 */
export const calculateRetirementCorpus = (
  currentAge: number,
  retirementAge: number,
  monthlyExpenses: number,
  inflationRate: number = 6,
  expectedReturn: number = 12
): {
  requiredCorpus: number;
  monthlySIP: number;
  totalInvestment: number;
  inflationAdjustedExpenses: number;
} => {
  if (currentAge >= retirementAge) {
    throw new Error('Retirement age must be greater than current age');
  }

  const yearsToRetirement = retirementAge - currentAge;
  const yearsAfterRetirement = 25; // Assuming 25 years post-retirement

  // Calculate inflation-adjusted monthly expenses at retirement
  const inflationAdjustedExpenses = 
    monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);

  // Annual expenses after retirement
  const annualExpensesAtRetirement = inflationAdjustedExpenses * 12;

  // Required corpus using 4% withdrawal rule (adjusted for India - using 6%)
  const withdrawalRate = 0.06;
  const requiredCorpus = annualExpensesAtRetirement / withdrawalRate;

  // Calculate required monthly SIP
  const goalResult = calculateGoalBasedSIP(requiredCorpus, expectedReturn, yearsToRetirement);

  return {
    requiredCorpus: Math.round(requiredCorpus),
    monthlySIP: goalResult.monthlyAmount || 0,
    totalInvestment: goalResult.totalInvestment,
    inflationAdjustedExpenses: Math.round(inflationAdjustedExpenses),
  };
};

/**
 * Calculate ELSS (Equity Linked Savings Scheme) returns with tax benefits
 * 
 * @param monthlyInvestment - Monthly ELSS investment
 * @param expectedReturn - Expected annual return (as percentage)
 * @param years - Investment period (minimum 3 years lock-in)
 * @param taxBracket - Income tax bracket (as percentage, e.g., 30)
 * @returns ELSS calculation with tax savings
 */
export const calculateELSSReturns = (
  monthlyInvestment: number,
  expectedReturn: number,
  years: number,
  taxBracket: number = 30
): InvestmentResult & { taxSavings: number; effectiveInvestment: number } => {
  if (monthlyInvestment <= 0 || expectedReturn <= 0 || years < 3) {
    throw new Error('Invalid inputs. ELSS has minimum 3-year lock-in period');
  }

  const annualInvestment = monthlyInvestment * 12;
  const maxTaxBenefit = 150000; // Section 80C limit
  
  const eligibleForTaxBenefit = Math.min(annualInvestment, maxTaxBenefit);
  const taxSavings = (eligibleForTaxBenefit * taxBracket) / 100;
  const effectiveInvestment = annualInvestment - taxSavings;

  const sipResult = calculateSIPReturns(monthlyInvestment, expectedReturn, years);

  return {
    ...sipResult,
    taxSavings: Math.round(taxSavings),
    effectiveInvestment: Math.round(effectiveInvestment),
  };
};

/**
 * Calculate step-up SIP returns (SIP with annual increment)
 * 
 * @param initialMonthlySIP - Starting monthly SIP amount
 * @param annualIncrement - Annual increment percentage
 * @param expectedReturn - Expected annual return (as percentage)
 * @param years - Investment period
 * @returns Step-up SIP calculation
 */
export const calculateStepUpSIP = (
  initialMonthlySIP: number,
  annualIncrement: number,
  expectedReturn: number,
  years: number
): InvestmentResult => {
  if (initialMonthlySIP <= 0 || annualIncrement < 0 || expectedReturn <= 0 || years <= 0) {
    throw new Error('All values must be positive numbers');
  }

  const monthlyRate = expectedReturn / 100 / 12;
  let totalInvestment = 0;
  let futureValue = 0;
  let currentMonthlySIP = initialMonthlySIP;

  for (let year = 1; year <= years; year++) {
    // Calculate SIP for current year
    const yearlyInvestment = currentMonthlySIP * 12;
    totalInvestment += yearlyInvestment;

    // Calculate future value for this year's investments
    const monthsRemaining = (years - year + 1) * 12;
    for (let month = 1; month <= 12; month++) {
      const monthsToMaturity = monthsRemaining - month + 1;
      futureValue += currentMonthlySIP * Math.pow(1 + monthlyRate, monthsToMaturity);
    }

    // Increment SIP for next year
    currentMonthlySIP = currentMonthlySIP * (1 + annualIncrement / 100);
  }

  const totalInterest = futureValue - totalInvestment;

  return {
    futureValue: Math.round(futureValue * 100) / 100,
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
  };
};

/**
 * Calculate portfolio asset allocation and expected returns
 * 
 * @param allocations - Array of {amount, expectedReturn, assetClass}
 * @returns Portfolio metrics and projections
 */
export const calculatePortfolioReturns = (
  allocations: Array<{
    amount: number;
    expectedReturn: number;
    assetClass: string;
  }>,
  years: number
): {
  totalInvestment: number;
  weightedAverageReturn: number;
  futureValue: number;
  totalInterest: number;
  assetBreakdown: Array<{
    assetClass: string;
    allocation: number;
    futureValue: number;
  }>;
} => {
  const totalInvestment = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  
  if (totalInvestment <= 0) {
    throw new Error('Total investment must be positive');
  }

  let weightedReturn = 0;
  let totalFutureValue = 0;
  const assetBreakdown = allocations.map(allocation => {
    const weight = allocation.amount / totalInvestment;
    weightedReturn += weight * allocation.expectedReturn;

    const assetFutureValue = calculateInvestmentReturns(
      allocation.amount,
      allocation.expectedReturn,
      years
    ).futureValue;

    totalFutureValue += assetFutureValue;

    return {
      assetClass: allocation.assetClass,
      allocation: Math.round(weight * 100 * 100) / 100, // Percentage
      futureValue: assetFutureValue,
    };
  });

  const totalInterest = totalFutureValue - totalInvestment;

  return {
    totalInvestment,
    weightedAverageReturn: Math.round(weightedReturn * 100) / 100,
    futureValue: Math.round(totalFutureValue * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    assetBreakdown,
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format percentage for display
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
import { Investment } from '../types/Investment';
import { investmentService } from './investmentService';

const sampleInvestments: Omit<Investment, 'id' | 'createdAt'>[] = [
  {
    userId: 'mock_user_id',
    type: 'monthly_income',
    title: 'Software Engineer Salary',
    amount: 75000,
    date: new Date(2024, 11, 1).toISOString(),
    description: 'Monthly salary from tech company',
    isRecurring: true,
    recurringFrequency: 'monthly',
  },
  {
    userId: 'mock_user_id',
    type: 'mutual_fund',
    title: 'SBI Bluechip Fund',
    amount: 15000,
    date: new Date(2024, 11, 5).toISOString(),
    description: 'Monthly SIP in equity mutual fund',
    isRecurring: true,
    recurringFrequency: 'monthly',
  },
  {
    userId: 'mock_user_id',
    type: 'stocks',
    title: 'HDFC Bank Shares',
    amount: 25000,
    date: new Date(2024, 10, 15).toISOString(),
    description: 'Investment in banking sector',
    isRecurring: false,
  },
  {
    userId: 'mock_user_id',
    type: 'crypto',
    title: 'Bitcoin Investment',
    amount: 10000,
    date: new Date(2024, 10, 20).toISOString(),
    description: 'Cryptocurrency investment',
    isRecurring: false,
  },
  {
    userId: 'mock_user_id',
    type: 'bonds',
    title: 'Government Bonds',
    amount: 50000,
    date: new Date(2024, 9, 1).toISOString(),
    description: 'Safe government bond investment',
    isRecurring: false,
  },
];

export const seedInvestmentData = async () => {
  try {
    console.log('Seeding investment data...');
    
    for (const investment of sampleInvestments) {
      await investmentService.addInvestment(investment);
    }
    
    console.log('Investment data seeded successfully!');
  } catch (error) {
    console.error('Error seeding investment data:', error);
  }
};

export const clearInvestmentData = async () => {
  try {
    console.log('Clearing investment data...');
    const investments = await investmentService.getUserInvestments('mock_user_id');
    
    for (const investment of investments) {
      if (investment.id) {
        await investmentService.deleteInvestment(investment.id);
      }
    }
    
    console.log('Investment data cleared successfully!');
  } catch (error) {
    console.error('Error clearing investment data:', error);
  }
};

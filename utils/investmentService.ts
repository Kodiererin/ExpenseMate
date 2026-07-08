import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { Investment } from '../domain/Investment';

export const investmentService = {
  async addInvestment(investment: Omit<Investment, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'investments'), {
        ...investment,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding investment:', error);
      throw error;
    }
  },

  async getUserInvestments(userId: string) {
    try {
      // First try with compound query, fallback to simple query if index not available
      let querySnapshot;
      try {
        const q = query(
          collection(db, 'investments'),
          where('userId', '==', userId),
          orderBy('date', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (indexError) {
        console.log('Using fallback query without orderBy:', indexError);
        // Fallback to simple query without orderBy
        const q = query(
          collection(db, 'investments'),
          where('userId', '==', userId)
        );
        querySnapshot = await getDocs(q);
      }

      const investments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Investment[];

      // Sort by most recent date. Dates are stored as string[] (recurring has many),
      // so compare using the latest date in each investment's array.
      const latestTime = (inv: Investment) => {
        const dates = Array.isArray(inv.date) ? inv.date : [inv.date as unknown as string];
        return dates.reduce((max, d) => {
          const t = new Date(d).getTime();
          return isNaN(t) ? max : Math.max(max, t);
        }, 0);
      };
      return investments.sort((a, b) => latestTime(b) - latestTime(a));
    } catch (error) {
      console.error('Error fetching investments:', error);
      throw error;
    }
  },

  async deleteInvestment(investmentId: string) {
    try {
      await deleteDoc(doc(db, 'investments', investmentId));
    } catch (error) {
      console.error('Error deleting investment:', error);
      throw error;
    }
  },

  getInvestmentsByCategory(investments: Investment[]) {
    // Helper function to get category from type if category is missing (legacy data)
    const getCategory = (investment: Investment) => {
      if (investment.category) return investment.category;

      // Fallback for legacy data
      const incomeTypes = ['salary', 'bonus', 'commission', 'freelance', 'dividend', 'interest', 'rental', 'other'];
      const investmentTypes = ['mutual_fund', 'stocks', 'bonds', 'real_estate', 'crypto'];
      const savingsTypes = ['fixed_deposit', 'ppf', 'nps', 'insurance'];

      if (incomeTypes.includes(investment.type)) return 'income';
      if (investmentTypes.includes(investment.type)) return 'investment';
      if (savingsTypes.includes(investment.type)) return 'savings';
      return 'income'; // default fallback
    };

    const categories = {
      income: investments.filter(inv => getCategory(inv) === 'income'),
      investment: investments.filter(inv => getCategory(inv) === 'investment'),
      savings: investments.filter(inv => getCategory(inv) === 'savings'),
    };

    return {
      income: categories.income.reduce((sum, inv) => sum + inv.amount, 0),
      investment: categories.investment.reduce((sum, inv) => sum + inv.amount, 0),
      savings: categories.savings.reduce((sum, inv) => sum + inv.amount, 0),
    };
  },

  getTaxableIncome(investments: Investment[]) {
    return investments
      .filter(inv => inv.taxable)
      .reduce((total, inv) => total + inv.amount, 0);
  },

  getNonTaxableIncome(investments: Investment[]) {
    return investments
      .filter(inv => !inv.taxable)
      .reduce((total, inv) => total + inv.amount, 0);
  },

  getRecurringIncome(investments: Investment[]) {
    return investments
      .filter(inv => inv.isRecurring && inv.category === 'income')
      .reduce((total, inv) => total + inv.amount, 0);
  },

  getInvestmentsByType(investments: Investment[]) {
    const summary = investments.reduce((acc, investment) => {
      acc[investment.type] = (acc[investment.type] || 0) + investment.amount;
      return acc;
    }, {} as Record<string, number>);
    return summary;
  },

  getTotalInvestments(investments: Investment[]) {
    return investments.reduce((total, investment) => total + investment.amount, 0);
  },

  getMonthlyIncome(investments: Investment[]) {
    return investments
      .filter(inv => inv.category === 'income' && inv.isRecurring && inv.recurringFrequency === 'monthly')
      .reduce((total, inv) => total + inv.amount, 0);
  },
};

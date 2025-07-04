import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../constants/firebase";
import { Expense } from "../types/Expense";
import { Goal } from "../types/Goal";

// Optimized query functions to reduce database calls

export const getExpensesByDateRange = async (startDate: string, endDate: string): Promise<Expense[]> => {
  try {
    console.log(`Fetching expenses from ${startDate} to ${endDate}`);
    
    // Use Firestore's range query for better performance
    const q = query(
      collection(db, "expenses"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc"),
      limit(100) // Limit to prevent excessive data transfer
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        date: data.date,
        description: data.description || '',
        price: data.price || '0',
        tag: data.tag || 'Unknown'
      } as Expense);
    });
    
    console.log(`Fetched ${expenses.length} expenses for date range`);
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses by date range: ", error);
    return [];
  }
};

export const getRecentExpenses = async (limitCount: number = 50): Promise<Expense[]> => {
  try {
    console.log(`Fetching ${limitCount} recent expenses`);
    
    const q = query(
      collection(db, "expenses"),
      orderBy("date", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        date: data.date,
        description: data.description || '',
        price: data.price || '0',
        tag: data.tag || 'Unknown'
      } as Expense);
    });
    
    console.log(`Fetched ${expenses.length} recent expenses`);
    return expenses;
  } catch (error) {
    console.error("Error fetching recent expenses: ", error);
    return [];
  }
};

export const getExpensesByCategory = async (category: string, limitCount: number = 50): Promise<Expense[]> => {
  try {
    console.log(`Fetching expenses for category: ${category}`);
    
    const q = query(
      collection(db, "expenses"),
      where("tag", "==", category),
      orderBy("date", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        date: data.date,
        description: data.description || '',
        price: data.price || '0',
        tag: data.tag || 'Unknown'
      } as Expense);
    });
    
    console.log(`Fetched ${expenses.length} expenses for category ${category}`);
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses by category: ", error);
    return [];
  }
};

export const getGoalsByDateRange = async (startMonthYear: string, endMonthYear: string): Promise<Goal[]> => {
  try {
    console.log(`Fetching goals from ${startMonthYear} to ${endMonthYear}`);
    
    const q = query(
      collection(db, "goals"),
      where("monthYear", ">=", startMonthYear),
      where("monthYear", "<=", endMonthYear),
      orderBy("monthYear", "desc"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    
    const querySnapshot = await getDocs(q);
    const goals: Goal[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      goals.push({
        id: doc.id,
        text: data.text,
        completed: data.completed,
        monthYear: data.monthYear,
        createdAt: data.createdAt
      } as Goal);
    });
    
    console.log(`Fetched ${goals.length} goals for date range`);
    return goals;
  } catch (error) {
    console.error("Error fetching goals by date range: ", error);
    return [];
  }
};

// Batch operations for better performance
export const batchAddExpenses = async (expenses: Omit<Expense, 'id'>[]): Promise<void> => {
  try {
    const promises = expenses.map(expense => 
      addDoc(collection(db, "expenses"), expense)
    );
    
    await Promise.all(promises);
    console.log(`Batch added ${expenses.length} expenses`);
  } catch (error) {
    console.error("Error batch adding expenses: ", error);
    throw error;
  }
};

export const batchDeleteExpenses = async (expenseIds: string[]): Promise<void> => {
  try {
    const promises = expenseIds.map(id => 
      deleteDoc(doc(db, "expenses", id))
    );
    
    await Promise.all(promises);
    console.log(`Batch deleted ${expenseIds.length} expenses`);
  } catch (error) {
    console.error("Error batch deleting expenses: ", error);
    throw error;
  }
};

// Aggregated data queries
export const getExpenseSummaryByMonth = async (year: number): Promise<{[month: string]: number}> => {
  try {
    console.log(`Fetching expense summary for year ${year}`);
    
    const startDate = `1/1/${year}`;
    const endDate = `12/31/${year}`;
    
    const q = query(
      collection(db, "expenses"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const monthlyTotals: {[month: string]: number} = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const dateParts = data.date.split('/');
      if (dateParts.length === 3) {
        const month = dateParts[0];
        const price = parseFloat(data.price) || 0;
        monthlyTotals[month] = (monthlyTotals[month] || 0) + price;
      }
    });
    
    console.log(`Calculated monthly totals for ${year}`);
    return monthlyTotals;
  } catch (error) {
    console.error("Error fetching expense summary: ", error);
    return {};
  }
};

export const getCategorySummary = async (monthYear?: string): Promise<{[category: string]: number}> => {
  try {
    console.log(`Fetching category summary${monthYear ? ` for ${monthYear}` : ''}`);
    
    let q;
    if (monthYear) {
      // Parse monthYear to get date range
      const [monthName, year] = monthYear.split(' ');
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(monthName) + 1;
      
      const startDate = `${monthIndex}/1/${year}`;
      const endDate = `${monthIndex}/31/${year}`;
      
      q = query(
        collection(db, "expenses"),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
      );
    } else {
      q = query(
        collection(db, "expenses"),
        orderBy("date", "desc"),
        limit(500) // Limit for performance
      );
    }
    
    const querySnapshot = await getDocs(q);
    const categoryTotals: {[category: string]: number} = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const category = data.tag || 'Unknown';
      const price = parseFloat(data.price) || 0;
      categoryTotals[category] = (categoryTotals[category] || 0) + price;
    });
    
    console.log(`Calculated category totals${monthYear ? ` for ${monthYear}` : ''}`);
    return categoryTotals;
  } catch (error) {
    console.error("Error fetching category summary: ", error);
    return {};
  }
};

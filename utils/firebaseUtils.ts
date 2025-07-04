import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../constants/firebase";
import { Expense } from "../types/Expense";
import { Goal } from "../types/Goal";

// Cache invalidation callbacks with debouncing
let onDataChangeCallbacks: (() => void)[] = [];
let notifyTimeout: ReturnType<typeof setTimeout> | null = null;

export const registerDataChangeCallback = (callback: () => void) => {
  onDataChangeCallbacks.push(callback);
};

export const unregisterDataChangeCallback = (callback: () => void) => {
  onDataChangeCallbacks = onDataChangeCallbacks.filter(cb => cb !== callback);
};

const notifyDataChange = () => {
  // Debounce notifications to prevent excessive calls
  if (notifyTimeout) {
    clearTimeout(notifyTimeout);
  }
  
  notifyTimeout = setTimeout(() => {
    console.log(`Notifying ${onDataChangeCallbacks.length} data change callbacks`);
    onDataChangeCallbacks.forEach((callback, index) => {
      console.log(`Calling callback ${index + 1}`);
      callback();
    });
  }, 100); // 100ms debounce
};

export const addExpenseToFirestore = async (expense: Omit<Expense, 'id'>): Promise<void> => {
  try {
    console.log('Adding expense to Firestore:', expense);
    const docRef = await addDoc(collection(db, "expenses"), expense);
    console.log("Expense stored with ID: ", docRef.id);
    console.log('About to notify data change...');
    notifyDataChange(); // Invalidate cache
    console.log('Data change notification sent');
  } catch (error) {
    console.error("Error adding expense to Firestore: ", error);
    throw error;
  }
};

export const deleteExpenseFromFirestore = async (expenseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "expenses", expenseId));
    console.log("Expense deleted with ID: ", expenseId);
    notifyDataChange(); // Invalidate cache
  } catch (error) {
    console.error("Error deleting expense from Firestore: ", error);
    throw error;
  }
};

export const getExpensesByMonth = async (month: number, year: number): Promise<Expense[]> => {
  try {
    console.log(`Filtering expenses for month: ${month}, year: ${year}`);
    
    // Get all expenses and filter by month on the client side
    // This is needed because Firestore date field is stored as string in "M/D/YYYY" format
    const q = query(
      collection(db, "expenses"),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Processing expense with date: ${data.date}`);
      
      // Parse "M/D/YYYY" format manually with validation
      if (data.date && typeof data.date === 'string') {
        const dateParts = data.date.split('/');
        if (dateParts.length === 3) {
          const expenseMonth = parseInt(dateParts[0], 10);
          const expenseDay = parseInt(dateParts[1], 10);
          const expenseYear = parseInt(dateParts[2], 10);
          
          // Validate parsed values
          if (!isNaN(expenseMonth) && !isNaN(expenseDay) && !isNaN(expenseYear) &&
              expenseMonth >= 1 && expenseMonth <= 12 &&
              expenseDay >= 1 && expenseDay <= 31 &&
              expenseYear >= 1900 && expenseYear <= 2100) {
            
            console.log(`Parsed: month=${expenseMonth}, day=${expenseDay}, year=${expenseYear}`);
            
            // Check if the expense belongs to the requested month and year
            if (expenseYear === year && expenseMonth === month) {
              expenses.push({
                id: doc.id,
                date: data.date,
                description: data.description || '',
                price: data.price || '0',
                tag: data.tag || 'Unknown'
              } as Expense);
            }
          }
        }
      }
    });
    
    // Sort by date descending (newest first)
    expenses.sort((a, b) => {
      const parseDate = (dateStr: string) => {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10);
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
            return new Date(year, month - 1, day);
          }
        }
        return new Date(0); // Return epoch if parsing fails
      };
      return parseDate(b.date).getTime() - parseDate(a.date).getTime();
    });
    
    console.log(`Fetched ${expenses.length} expenses for ${year}-${month.toString().padStart(2, '0')}`);
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses by month: ", error);
    // Check if it's a network error
    if (error instanceof Error && error.message.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    return [];
  }
};

export const getAllAvailableMonths = async (): Promise<string[]> => {
  try {
    const q = query(
      collection(db, "expenses"),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const months = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Parse "M/D/YYYY" format manually
      const dateParts = data.date.split('/');
      if (dateParts.length === 3) {
        const expenseMonth = parseInt(dateParts[0], 10);
        const expenseYear = parseInt(dateParts[2], 10);
        
        if (!isNaN(expenseMonth) && !isNaN(expenseYear)) {
          const monthKey = `${expenseYear}-${expenseMonth.toString().padStart(2, '0')}`;
          months.add(monthKey);
        }
      }
    });
    
    const sortedMonths = Array.from(months).sort().reverse();
    console.log('Available months:', sortedMonths);
    return sortedMonths;
  } catch (error) {
    console.error("Error fetching available months: ", error);
    return [];
  }
};

export const getAllExpenses = async (): Promise<Expense[]> => {
  try {
    console.log('Fetching all expenses from Firestore...');
    const q = query(
      collection(db, "expenses"),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        date: data.date,
        description: data.description,
        price: data.price,
        tag: data.tag
      } as Expense);
    });
    
    console.log(`Fetched ${expenses.length} total expenses:`, expenses.map(e => `${e.tag}: ₹${e.price} (${e.date})`));
    return expenses;
  } catch (error) {
    console.error("Error fetching all expenses: ", error);
    return [];
  }
};

// Goal-related functions
export const addGoalToFirestore = async (goal: Omit<Goal, 'id'>): Promise<void> => {
  try {
    const docRef = await addDoc(collection(db, "goals"), goal);
    console.log("Goal stored with ID: ", docRef.id);
    notifyDataChange(); // Invalidate cache
  } catch (error) {
    console.error("Error adding goal to Firestore: ", error);
    throw error;
  }
};

export const deleteGoalFromFirestore = async (goalId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "goals", goalId));
    console.log("Goal deleted with ID: ", goalId);
    notifyDataChange(); // Invalidate cache
  } catch (error) {
    console.error("Error deleting goal from Firestore: ", error);
    throw error;
  }
};

export const updateGoalInFirestore = async (goalId: string, updates: Partial<Omit<Goal, 'id'>>): Promise<void> => {
  try {
    await updateDoc(doc(db, "goals", goalId), updates);
    console.log("Goal updated with ID: ", goalId);
    notifyDataChange(); // Invalidate cache
  } catch (error) {
    console.error("Error updating goal in Firestore: ", error);
    throw error;
  }
};

export const getGoalsByMonthYear = async (monthYear: string): Promise<Goal[]> => {
  try {
    console.log(`Fetching goals for month-year: ${monthYear}`);
    
    // Remove orderBy to avoid composite index requirement
    const q = query(
      collection(db, "goals"),
      where("monthYear", "==", monthYear)
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
    
    // Sort on client side by createdAt descending (newest first)
    goals.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    
    console.log(`Fetched ${goals.length} goals for ${monthYear}`);
    return goals;
  } catch (error) {
    console.error("Error fetching goals by month-year: ", error);
    return [];
  }
};

export const getAllAvailableGoalMonths = async (): Promise<string[]> => {
  try {
    // Remove orderBy to avoid index requirements
    const q = query(collection(db, "goals"));
    
    const querySnapshot = await getDocs(q);
    const months = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.monthYear) {
        months.add(data.monthYear);
      }
    });
    
    const sortedMonths = Array.from(months).sort((a, b) => {
      // Sort by year then month
      const [aMonth, aYear] = a.split(' ');
      const [bMonth, bYear] = b.split(' ');
      
      if (aYear !== bYear) {
        return parseInt(bYear) - parseInt(aYear); // Descending year
      }
      
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      return monthOrder.indexOf(bMonth) - monthOrder.indexOf(aMonth); // Descending month
    });
    
    console.log('Available goal months:', sortedMonths);
    return sortedMonths;
  } catch (error) {
    console.error("Error fetching available goal months: ", error);
    return [];
  }
};

// Debug function to test basic Firebase connectivity
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase connection...');
    const q = query(collection(db, "expenses"));
    const querySnapshot = await getDocs(q);
    console.log(`Firebase connection successful. Found ${querySnapshot.size} total documents in expenses collection`);
    
    // Log first few documents for debugging
    let count = 0;
    querySnapshot.forEach((doc) => {
      if (count < 3) {
        console.log(`Sample expense ${count + 1}:`, {
          id: doc.id,
          data: doc.data()
        });
        count++;
      }
    });
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

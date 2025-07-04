import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Expense } from '../types/Expense';
import { Goal } from '../types/Goal';
import {
  getAllAvailableGoalMonths,
  getAllAvailableMonths,
  getAllExpenses,
  getGoalsByMonthYear,
  registerDataChangeCallback,
  unregisterDataChangeCallback
} from '../utils/firebaseUtils';

interface DataContextType {
  // Expenses
  expenses: Expense[];
  expensesLoading: boolean;
  getExpensesByMonth: (month: number, year: number) => Expense[];
  refreshExpenses: () => Promise<void>;
  
  // Goals
  goals: { [monthYear: string]: Goal[] };
  goalsLoading: boolean;
  getGoalsByMonth: (monthYear: string) => Goal[];
  refreshGoals: (monthYear: string) => Promise<void>;
  
  // Available months
  availableMonths: string[];
  availableGoalMonths: string[];
  
  // Cache management
  clearCache: () => Promise<void>;
  lastRefresh: Date | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEYS = {
  EXPENSES: 'cached_expenses',
  GOALS: 'cached_goals',
  AVAILABLE_MONTHS: 'cached_available_months',
  AVAILABLE_GOAL_MONTHS: 'cached_available_goal_months',
  LAST_REFRESH: 'last_refresh_timestamp'
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<{ [monthYear: string]: Goal[] }>({});
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableGoalMonths, setAvailableGoalMonths] = useState<string[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Add debounced refresh to prevent excessive operations
  const [refreshTimeout, setRefreshTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  const debouncedRefresh = useCallback(async () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    const timeout = setTimeout(async () => {
      await refreshExpenses();
    }, 300); // 300ms debounce
    
    setRefreshTimeout(timeout);
  }, [refreshExpenses, refreshTimeout]);

  const refreshExpenses = useCallback(async () => {
    console.log('Starting refreshExpenses...');
    setExpensesLoading(true);
    try {
      const [freshExpenses, freshAvailableMonths] = await Promise.all([
        getAllExpenses(),
        getAllAvailableMonths()
      ]);
      
      console.log(`Setting ${freshExpenses.length} fresh expenses in context`);
      setExpenses(freshExpenses);
      setAvailableMonths(freshAvailableMonths);
      
      const refreshTime = new Date();
      setLastRefresh(refreshTime);
      
      // Cache the data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(freshExpenses)),
        AsyncStorage.setItem(STORAGE_KEYS.AVAILABLE_MONTHS, JSON.stringify(freshAvailableMonths)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_REFRESH, refreshTime.toISOString())
      ]);
      
      console.log('Expenses refreshed and cached successfully');
    } catch (error) {
      console.error('Error refreshing expenses:', error);
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  const loadCachedData = useCallback(async () => {
    try {
      const [
        cachedExpenses,
        cachedGoals,
        cachedAvailableMonths,
        cachedAvailableGoalMonths,
        cachedLastRefresh
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.AVAILABLE_MONTHS),
        AsyncStorage.getItem(STORAGE_KEYS.AVAILABLE_GOAL_MONTHS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_REFRESH)
      ]);

      if (cachedExpenses) {
        setExpenses(JSON.parse(cachedExpenses));
      }
      if (cachedGoals) {
        setGoals(JSON.parse(cachedGoals));
      }
      if (cachedAvailableMonths) {
        setAvailableMonths(JSON.parse(cachedAvailableMonths));
      }
      if (cachedAvailableGoalMonths) {
        setAvailableGoalMonths(JSON.parse(cachedAvailableGoalMonths));
      }
      if (cachedLastRefresh) {
        setLastRefresh(new Date(cachedLastRefresh));
      }

      // Check if cache is stale
      if (cachedLastRefresh) {
        const lastRefreshTime = new Date(cachedLastRefresh);
        const now = new Date();
        const timeDiff = now.getTime() - lastRefreshTime.getTime();
        
        if (timeDiff > CACHE_DURATION) {
          console.log('Cache is stale, refreshing data...');
          await refreshExpenses();
        } else {
          console.log('Using cached data');
          setExpensesLoading(false);
        }
      } else {
        // No cache, fetch fresh data
        await refreshExpenses();
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
      await refreshExpenses();
    }
  }, [refreshExpenses]);

  // Load cached data on app start
  useEffect(() => {
    loadCachedData();
    
    // Register for data change notifications
    const handleDataChange = async () => {
      console.log('Data changed, refreshing cache...');
      // Use debounced refresh to prevent excessive operations
      await debouncedRefresh();
    };
    
    registerDataChangeCallback(handleDataChange);
    
    // Cleanup on unmount
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unregisterDataChangeCallback(handleDataChange);
    };
  }, [loadCachedData, debouncedRefresh, refreshTimeout]);

  const refreshGoals = useCallback(async (monthYear: string) => {
    setGoalsLoading(true);
    try {
      const [freshGoals, freshAvailableGoalMonths] = await Promise.all([
        getGoalsByMonthYear(monthYear),
        getAllAvailableGoalMonths()
      ]);
      
      setGoals(prev => ({
        ...prev,
        [monthYear]: freshGoals
      }));
      setAvailableGoalMonths(freshAvailableGoalMonths);
      
      // Cache the goals
      const updatedGoals = {
        ...goals,
        [monthYear]: freshGoals
      };
      
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals)),
        AsyncStorage.setItem(STORAGE_KEYS.AVAILABLE_GOAL_MONTHS, JSON.stringify(freshAvailableGoalMonths))
      ]);
      
      console.log(`Goals for ${monthYear} refreshed and cached`);
    } catch (error) {
      console.error('Error refreshing goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  }, [goals]);

  const getExpensesByMonth = useCallback((month: number, year: number): Expense[] => {
    console.log(`DataContext: Getting expenses for month ${month}, year ${year}`);
    console.log(`DataContext: Total expenses available: ${expenses.length}`);
    
    const filteredExpenses = expenses.filter(expense => {
      const dateParts = expense.date.split('/');
      if (dateParts.length === 3) {
        const expenseMonth = parseInt(dateParts[0], 10);
        const expenseYear = parseInt(dateParts[2], 10);
        const matches = expenseMonth === month && expenseYear === year;
        return matches;
      }
      return false;
    });
    
    console.log(`DataContext: Returning ${filteredExpenses.length} expenses for ${month}/${year}`);
    return filteredExpenses;
  }, [expenses]);

  const getGoalsByMonth = useCallback((monthYear: string): Goal[] => {
    return goals[monthYear] || [];
  }, [goals]);

  const clearCache = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.removeItem(STORAGE_KEYS.GOALS),
        AsyncStorage.removeItem(STORAGE_KEYS.AVAILABLE_MONTHS),
        AsyncStorage.removeItem(STORAGE_KEYS.AVAILABLE_GOAL_MONTHS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_REFRESH)
      ]);
      
      setExpenses([]);
      setGoals({});
      setAvailableMonths([]);
      setAvailableGoalMonths([]);
      setLastRefresh(null);
      
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  const value: DataContextType = {
    expenses,
    expensesLoading,
    getExpensesByMonth,
    refreshExpenses,
    goals,
    goalsLoading,
    getGoalsByMonth,
    refreshGoals,
    availableMonths,
    availableGoalMonths,
    clearCache,
    lastRefresh
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// ...existing code...
// ...existing code...
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Investment } from '../types/Investment';
import { investmentService } from '../utils/investmentService';

interface InvestmentContextType {
  investments: Investment[];
  loading: boolean;
  lastRefresh: number;
  refreshInvestments: (force?: boolean) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt'>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  getTotalInvestments: () => number;
  getMonthlyIncome: () => number;
  getInvestmentsByType: () => { [key: string]: number };
  getInvestmentsByCategory: () => { income: number; investment: number; savings: number };
  getTaxableIncome: () => number;
  getNonTaxableIncome: () => number;
  getRecurringIncome: () => number;
}

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

export const useInvestments = () => {
  const context = useContext(InvestmentContext);
  if (!context) {
    throw new Error('useInvestments must be used within an InvestmentProvider');
  }
  return context;
};

interface InvestmentProviderProps {
  children: ReactNode;
}

export const InvestmentProvider: React.FC<InvestmentProviderProps> = ({ children }) => {
  // Helper to get all recurring dates for a recurring investment
  const getRecurringDates = (startDateStr: string, frequency: 'monthly' | 'quarterly' | 'yearly'): string[] => {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: string[] = [];
    let current = new Date(startDate);
    while (current <= today) {
      dates.push(current.toISOString());
      if (frequency === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else if (frequency === 'quarterly') {
        current.setMonth(current.getMonth() + 3);
      } else if (frequency === 'yearly') {
        current.setFullYear(current.getFullYear() + 1);
      } else {
        break;
      }
    }
    return dates;
  };
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  
  // Mock user ID - in a real app, this would come from authentication
  const userId = 'mock_user_id';
  
  // Cache configuration
  const CACHE_KEY = `investments_${userId}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const LAST_REFRESH_KEY = `last_refresh_${userId}`;

  // Load cached data
  const loadCachedData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      const cachedRefresh = await AsyncStorage.getItem(LAST_REFRESH_KEY);
      
      if (cachedData && cachedRefresh) {
        const parsedData = JSON.parse(cachedData);
        const refreshTime = parseInt(cachedRefresh);
        const now = Date.now();
        
        // Use cache if it's still fresh
        if (now - refreshTime < CACHE_DURATION) {
          console.log('💾 Using cached investment data');
          setInvestments(parsedData);
          setLastRefresh(refreshTime);
          setLoading(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return false;
    }
  };

  // Save data to cache
  const saveToCache = async (data: Investment[]) => {
    try {
      const now = Date.now();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(LAST_REFRESH_KEY, now.toString());
      setLastRefresh(now);
      console.log('💾 Investment data cached successfully');
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const refreshInvestments = async (force: boolean = false) => {
    try {
      // Always fetch fresh data if forced
      if (force) {
        setLoading(true);
        console.log('🔄 Fetching fresh investment data from server (forced)');
        const userInvestments = await investmentService.getUserInvestments(userId);
        setInvestments(userInvestments);
        await saveToCache(userInvestments);
        return;
      }
      // If not forced, try to use cache first
      if (!loading) {
        const now = Date.now();
        if (now - lastRefresh < CACHE_DURATION) {
          console.log('⚡ Using existing cache, skipping refresh');
          return;
        }
      }
      setLoading(true);
      console.log('🔄 Fetching fresh investment data from server');
      const userInvestments = await investmentService.getUserInvestments(userId);
      setInvestments(userInvestments);
      await saveToCache(userInvestments);
    } catch (error) {
      console.error('Error loading investments:', error);
      // Try to load cached data on error
      const cacheLoaded = await loadCachedData();
      if (!cacheLoaded) {
        Alert.alert('Error', 'Failed to load investments');
      }
    } finally {
      setLoading(false);
    }
  };

  const addInvestment = async (investment: Omit<Investment, 'id' | 'createdAt'>) => {
    try {
      let investmentToAdd = { ...investment };
      if (investment.isRecurring && investment.recurringFrequency && investment.date && typeof investment.date === 'string') {
        // For recurring, generate all dates from start to present
        investmentToAdd.date = getRecurringDates(investment.date as string, investment.recurringFrequency);
      } else if (typeof investment.date === 'string') {
        // For normal, wrap date in array
        investmentToAdd.date = [investment.date as string];
      }
      await investmentService.addInvestment(investmentToAdd as Omit<Investment, 'id' | 'createdAt'>);
      await refreshInvestments(true); // Force refresh after adding
    } catch (error) {
      console.error('Error adding investment:', error);
      throw error;
    }
  };

  // Enhanced deleteInvestment to support recurring investments
  const deleteInvestment = async (id: string) => {
    try {
      console.log('[DEBUG] InvestmentContext.deleteInvestment called with id:', id);
      // Find the investment to delete
      const investmentToDelete = investments.find(inv => inv.id === id);
      if (investmentToDelete && investmentToDelete.isRecurring && Array.isArray(investmentToDelete.date)) {
        // Delete all matching recurring investments
        await investmentService.deleteInvestment(String(investmentToDelete.id));
        setInvestments(prev => prev.filter(inv => inv.id !== investmentToDelete.id));
      } else {
        // Non-recurring: delete single investment
        await investmentService.deleteInvestment(id);
        setInvestments(prev => prev.filter(inv => inv.id !== id));
      }
      await refreshInvestments(true); // Force refresh after deleting
      console.log('[DEBUG] Investments refreshed after deletion.');
    } catch (error) {
      console.error('[DEBUG] Error deleting investment:', error, id);
      throw error;
    }
  };

  // Calculation methods using investmentService
  const getTotalInvestments = () => {
    return investmentService.getTotalInvestments(investments);
  };

  const getMonthlyIncome = () => {
    return investmentService.getMonthlyIncome(investments);
  };

  const getInvestmentsByType = () => {
    return investmentService.getInvestmentsByType(investments);
  };

  const getInvestmentsByCategory = () => {
    return investmentService.getInvestmentsByCategory(investments);
  };

  const getTaxableIncome = () => {
    return investmentService.getTaxableIncome(investments);
  };

  const getNonTaxableIncome = () => {
    return investmentService.getNonTaxableIncome(investments);
  };

  const getRecurringIncome = () => {
    return investmentService.getRecurringIncome(investments);
  };

  useEffect(() => {
    const initializeData = async () => {
      // Try to load cached data first
      const cacheLoaded = await loadCachedData();
      if (!cacheLoaded) {
        // If no cache, fetch fresh data
        await refreshInvestments(true);
      }
    };
    
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: InvestmentContextType = {
    investments,
    loading,
    lastRefresh,
    refreshInvestments,
    addInvestment,
    deleteInvestment,
    getTotalInvestments,
    getMonthlyIncome,
    getInvestmentsByType,
    getInvestmentsByCategory,
    getTaxableIncome,
    getNonTaxableIncome,
    getRecurringIncome,
  };

  return <InvestmentContext.Provider value={value}>{children}</InvestmentContext.Provider>;
};

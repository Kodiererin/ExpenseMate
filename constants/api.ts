import { Platform } from 'react-native';

/**
 * API Configuration for ExpenseMate
 * 
 * For Android Emulator: Use 10.0.2.2 instead of localhost
 * For iOS Simulator: localhost works fine
 * For Physical Device: Replace with your computer's local IP address
 */

// Configure your backend server IP if needed
const LOCAL_IP = '10.78.215.104';

// Auto-detect the correct base URL based on platform
const getBaseUrl = () => {
    if (__DEV__) {
        // Development mode
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:7071/api';
        } else if (Platform.OS === 'ios') {
            return 'http://localhost:7071/api';
        }
        return `http://${LOCAL_IP}:7071/api`;
    }

    // Production mode - replace with your production API URL
    return 'https://your-production-api.com/api';
};

export const API_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
    // Add your API endpoints here
    // Example: expenses: `${API_BASE_URL}/expenses`,
};

/**
 * Helper function to make API calls with error handling
 * @param endpoint - The API endpoint URL
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise with the API response data
 */
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Call Error:', error);

        if (error instanceof TypeError && error.message === 'Network request failed') {
            throw new Error('Cannot connect to server. Please check your connection.');
        }
        throw error;
    }
};

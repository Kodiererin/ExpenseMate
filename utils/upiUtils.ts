import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

export interface UPIApp {
  name: string;
  packageName: string;
  icon: string;
  deepLink: string;
  scheme: string;
}

export const UPI_APPS: UPIApp[] = [
  { 
    name: 'PhonePe', 
    packageName: 'com.phonepe.app', 
    icon: '📱', 
    deepLink: 'phonepe://',
    scheme: 'phonepe'
  },
  { 
    name: 'Google Pay', 
    packageName: 'com.google.android.apps.nbu.paisa.user', 
    icon: '💳', 
    deepLink: 'tez://',
    scheme: 'tez'
  },
  { 
    name: 'Paytm', 
    packageName: 'net.one97.paytm', 
    icon: '💰', 
    deepLink: 'paytmmp://',
    scheme: 'paytmmp'
  },
  { 
    name: 'BHIM', 
    packageName: 'in.org.npci.upiapp', 
    icon: '🏦', 
    deepLink: 'bhimupi://',
    scheme: 'bhimupi'
  },
  { 
    name: 'Amazon Pay', 
    packageName: 'in.amazon.mShop.android.shopping', 
    icon: '🛒', 
    deepLink: 'amazonpay://',
    scheme: 'amazonpay'
  },
  { 
    name: 'WhatsApp Pay', 
    packageName: 'com.whatsapp', 
    icon: '💬', 
    deepLink: 'whatsapp://pay',
    scheme: 'whatsapp'
  },
];

export interface UPIPaymentDetails {
  merchantUPIId: string;
  merchantName: string;
  amount: string;
  transactionNote: string;
  transactionRef?: string;
}

/**
 * Generates a UPI payment URL according to NPCI UPI specifications
 */
export const generateUPIURL = (details: UPIPaymentDetails): string => {
  const {
    merchantUPIId,
    merchantName,
    amount,
    transactionNote,
    transactionRef
  } = details;

  // Standard UPI URL format as per NPCI guidelines
  let upiUrl = `upi://pay?pa=${encodeURIComponent(merchantUPIId)}`;
  upiUrl += `&pn=${encodeURIComponent(merchantName)}`;
  upiUrl += `&am=${encodeURIComponent(amount)}`;
  upiUrl += `&cu=INR`;
  upiUrl += `&tn=${encodeURIComponent(transactionNote)}`;
  
  if (transactionRef) {
    upiUrl += `&tr=${encodeURIComponent(transactionRef)}`;
  }

  return upiUrl;
};

/**
 * Generates app-specific UPI URLs for better compatibility
 */
export const generateAppSpecificUPIURL = (app: UPIApp, details: UPIPaymentDetails): string => {
  const standardUPI = generateUPIURL(details);
  
  // For most apps, the standard UPI URL works
  // But some apps have specific deep link formats
  switch (app.scheme) {
    case 'phonepe':
      // PhonePe supports standard UPI URLs
      return standardUPI;
    
    case 'tez':
      // Google Pay (formerly Tez) supports standard UPI URLs
      return standardUPI;
    
    case 'paytmmp':
      // Paytm supports standard UPI URLs
      return standardUPI;
    
    case 'bhimupi':
      // BHIM supports standard UPI URLs
      return standardUPI;
    
    case 'amazonpay':
      // Amazon Pay UPI integration
      return standardUPI;
    
    case 'whatsapp':
      // WhatsApp Pay has a different format
      return `whatsapp://pay?pa=${encodeURIComponent(details.merchantUPIId)}&am=${encodeURIComponent(details.amount)}`;
    
    default:
      return standardUPI;
  }
};

/**
 * Initiates UPI payment through the specified app
 */
export const initiateUPIPayment = async (
  app: UPIApp, 
  paymentDetails: UPIPaymentDetails
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Initiating UPI payment with details:', paymentDetails);
    
    const upiUrl = generateAppSpecificUPIURL(app, paymentDetails);
    console.log('Generated UPI URL:', upiUrl);
    
    // Check if the app can handle UPI URLs
    const canOpenUPI = await Linking.canOpenURL(upiUrl);
    console.log(`Can open UPI URL for ${app.name}:`, canOpenUPI);
    
    if (canOpenUPI) {
      await Linking.openURL(upiUrl);
      return { success: true, message: `Payment initiated through ${app.name}` };
    } else {
      // Try alternative schemes
      const alternatives = [
        `${app.scheme}://upi/pay?pa=${encodeURIComponent(paymentDetails.merchantUPIId)}&am=${encodeURIComponent(paymentDetails.amount)}`,
        app.deepLink,
        `upi://pay?pa=${encodeURIComponent(paymentDetails.merchantUPIId)}&am=${encodeURIComponent(paymentDetails.amount)}`
      ];
      
      for (const altUrl of alternatives) {
        try {
          const canOpenAlt = await Linking.canOpenURL(altUrl);
          if (canOpenAlt) {
            await Linking.openURL(altUrl);
            return { success: true, message: `${app.name} opened for payment` };
          }
        } catch (error) {
          console.log(`Failed to open ${altUrl}:`, error);
        }
      }
      
      return { 
        success: false, 
        message: `${app.name} is not available or doesn't support UPI payments.` 
      };
    }
  } catch (error) {
    console.error('UPI Payment Error:', error);
    return { 
      success: false, 
      message: `Failed to open ${app.name}. Error: ${error}` 
    };
  }
};

/**
 * Shows a payment confirmation dialog
 */
export const showPaymentConfirmation = (
  appName: string,
  amount: string,
  onSuccess: () => void,
  onFailure: () => void,
  onCancel: () => void
): void => {
  Alert.alert(
    'Payment Confirmation',
    `Payment of ₹${amount} has been initiated through ${appName}.\n\nDid you complete the payment successfully?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: 'Payment Failed',
        style: 'destructive',
        onPress: onFailure
      },
      {
        text: 'Payment Successful',
        style: 'default',
        onPress: onSuccess
      }
    ],
    { cancelable: false }
  );
};

/**
 * Validates UPI payment details
 */
export const validateUPIPaymentDetails = (details: UPIPaymentDetails): { valid: boolean; error?: string } => {
  const { merchantUPIId, merchantName, amount, transactionNote } = details;
  
  // Enhanced UPI ID validation
  if (!merchantUPIId || merchantUPIId.trim().length === 0) {
    return { valid: false, error: 'Merchant UPI ID is required' };
  }
  
  // UPI ID format validation (must contain @ and valid PSP)
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
  if (!upiRegex.test(merchantUPIId)) {
    return { valid: false, error: 'Invalid UPI ID format. Please check the merchant UPI ID.' };
  }
  
  // Check for valid PSP handles
  const validPSPs = ['paytm', 'phonepe', 'gpay', 'okaxis', 'okicici', 'okhdfcbank', 'oksbi', 'okbizaxis', 'ybl', 'ibl'];
  const pspHandle = merchantUPIId.split('@')[1].toLowerCase();
  if (!validPSPs.some(psp => pspHandle.includes(psp))) {
    return { valid: false, error: 'UPI ID uses an unsupported payment service provider. Please use a valid UPI ID.' };
  }
  
  if (!merchantName || merchantName.trim().length === 0) {
    return { valid: false, error: 'Merchant name is required' };
  }
  
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }
  
  if (numericAmount > 100000) {
    return { valid: false, error: 'Amount cannot exceed ₹1,00,000' };
  }
  
  if (!transactionNote || transactionNote.trim().length === 0) {
    return { valid: false, error: 'Transaction note is required' };
  }
  
  return { valid: true };
};

/**
 * Generates a unique transaction reference
 */
export const generateTransactionRef = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `EXP${timestamp}${random}`;
};

/**
 * Default merchant details - Replace with actual merchant information
 * For testing: Use a valid UPI ID (you can use your own UPI ID for testing)
 */
export const DEFAULT_MERCHANT_DETAILS = {
  merchantUPIId: '9876543210@paytm', // Replace with actual merchant UPI ID
  merchantName: 'ExpenseMate Store', // Replace with actual merchant name
};

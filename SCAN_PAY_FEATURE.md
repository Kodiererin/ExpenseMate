# Scan & Pay Feature Documentation

## Overview
The Scan & Pay feature allows users to scan product barcodes, enter expense details, and make UPI payments while automatically recording the expense in their ExpenseMate app.

## Features

### 📱 Barcode Scanning
- **Camera Permission**: Automatically requests camera permission when first used
- **Real-time Scanning**: Uses device camera to scan barcodes in real-time
- **Product Detection**: Automatically captures barcode data for expense tracking
- **Visual Feedback**: Clear scanning interface with frame guide

### 💰 Expense Recording
- **Category Selection**: Choose from predefined categories or add custom ones
- **Amount Input**: Enter payment amount with validation
- **Description**: Optional description field for additional notes
- **Auto-filling**: Scanned barcode data is automatically added to description

### 💳 UPI Payment Integration
- **Multiple UPI Apps**: Support for popular UPI apps:
  - PhonePe
  - Google Pay (GPay)
  - Paytm
  - BHIM
  - Amazon Pay
  - WhatsApp Pay
- **Standard UPI Protocol**: Uses NPCI-compliant UPI URL format
- **App Detection**: Automatically detects installed UPI apps
- **Payment Confirmation**: Manual confirmation system for payment success

## How to Use

### 1. Scan Product Barcode
1. Open the "Scan & Pay" tab
2. Tap "Scan Barcode" button
3. Grant camera permission if prompted
4. Position barcode within the scanning frame
5. Wait for automatic detection and capture

### 2. Enter Expense Details
1. Select expense category from dropdown
2. Enter payment amount
3. Add optional description
4. Scanned barcode data is automatically included

### 3. Make UPI Payment
1. Choose your preferred UPI app from the grid
2. App will open with pre-filled payment details
3. Complete payment in the UPI app
4. Return to ExpenseMate and confirm payment status

### 4. Record Expense
- On payment success, expense is automatically recorded
- Data is synced to Firebase
- Expense appears in history with UPI payment tag

## Technical Details

### Required Permissions
- **Camera**: For barcode scanning functionality
- **Internet**: For Firebase data sync

### UPI Integration
- Uses standard `upi://pay` protocol
- Supports merchant UPI ID configuration
- Generates unique transaction references
- Validates payment amounts and details

### Data Storage
- Expenses stored in Firebase Firestore
- Includes barcode data and payment method
- Automatic data refresh after successful payment

## Configuration

### Merchant Details
Update the merchant UPI details in `utils/upiUtils.ts`:

```typescript
export const DEFAULT_MERCHANT_DETAILS = {
  merchantUPIId: 'your-merchant@upi', // Replace with actual merchant UPI ID
  merchantName: 'Your Store Name', // Replace with actual merchant name
};
```

### UPI Apps
Add or modify supported UPI apps in `utils/upiUtils.ts`:

```typescript
export const UPI_APPS: UPIApp[] = [
  {
    name: 'App Name',
    packageName: 'com.app.package',
    icon: '🔥',
    deepLink: 'appscheme://',
    scheme: 'appscheme'
  },
  // ... more apps
];
```

## Error Handling

### Common Issues
1. **Camera Permission Denied**: Prompts user to enable in settings
2. **UPI App Not Installed**: Shows appropriate error message
3. **Invalid Payment Amount**: Validates amount before payment
4. **Network Issues**: Handles Firebase connection errors

### Payment Validation
- Amount must be positive and less than ₹1,00,000
- Category selection is mandatory
- Merchant UPI ID format validation
- Transaction note requirements

## Security Considerations

### Data Protection
- No sensitive payment data stored locally
- Only expense metadata recorded
- Firebase security rules apply
- No direct payment processing

### UPI Safety
- Uses official UPI protocol
- No payment credentials stored
- Manual confirmation required
- Standard UPI app security applies

## Future Enhancements

### Planned Features
1. **Product Database Integration**: Automatic product name lookup
2. **Receipt OCR**: Scan printed receipts for data extraction
3. **Bulk Payment Processing**: Multiple item checkout
4. **Payment History**: Detailed UPI transaction logs
5. **QR Code Support**: Support for merchant QR codes

### Performance Improvements
1. **Offline Mode**: Cache expenses for later sync
2. **Background Processing**: Async payment confirmation
3. **Enhanced Validation**: Real-time form validation
4. **Better Error Recovery**: Automatic retry mechanisms

## Troubleshooting

### Barcode Scanning Issues
- Ensure good lighting conditions
- Clean camera lens
- Hold device steady during scanning
- Try different angles if scanning fails

### UPI Payment Problems
- Verify UPI app is installed and updated
- Check internet connectivity
- Ensure sufficient account balance
- Try different UPI app if one fails

### Data Sync Issues
- Check internet connection
- Verify Firebase configuration
- Try manual refresh in history tab
- Contact support if problems persist

## Support

For technical support or feature requests:
1. Check the troubleshooting guide above
2. Review console logs for error details
3. Contact development team with specific error messages
4. Provide device and app version information

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, Section, Separator } from '../components/common';
import { useTheme } from '../contexts/ThemeContext';
import { 
  calculateInvestmentReturns, 
  calculateSIPReturns, 
  calculateFDReturns,
  calculateGoalBasedSIP,
  calculateEMI,
  calculatePPFReturns
} from '../utils/calculatorUtils';
import CalculatorInfo from './CalculatorInfo';

type InvestmentType = 'lumpsum' | 'sip' | 'fd' | 'ppf' | 'goal' | 'emi';

interface CalculationResults {
  futureValue: number;
  totalInterest: number;
  totalInvestment: number;
  monthlyAmount?: number;
  maturityAmount?: number;
  totalEMI?: number;
  monthlyBreakdown?: any[];
}

const Calculator: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [investmentType, setInvestmentType] = useState<InvestmentType>('lumpsum');
  const [amount, setAmount] = useState<string>('');
  const [monthlyAmount, setMonthlyAmount] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [years, setYears] = useState<string>('');
  const [goalAmount, setGoalAmount] = useState<string>('');
  const [compoundFrequency, setCompoundFrequency] = useState<number>(12);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const investmentTypes = [
    { 
      type: 'lumpsum' as InvestmentType, 
      title: 'Lump Sum', 
      subtitle: 'One-time',
      icon: 'wallet',
      color: '#6366F1',
      bgColor: '#6366F115',
    },
    { 
      type: 'sip' as InvestmentType, 
      title: 'SIP', 
      subtitle: 'Monthly',
      icon: 'trending-up',
      color: '#10B981',
      bgColor: '#10B98115',
    },
    { 
      type: 'fd' as InvestmentType, 
      title: 'Fixed Deposit', 
      subtitle: 'Bank FD',
      icon: 'business',
      color: '#3B82F6',
      bgColor: '#3B82F615',
    },
    { 
      type: 'ppf' as InvestmentType, 
      title: 'PPF', 
      subtitle: 'Tax saving',
      icon: 'shield-checkmark',
      color: '#059669',
      bgColor: '#05966915',
    },
    { 
      type: 'goal' as InvestmentType, 
      title: 'Goal Planning', 
      subtitle: 'Target based',
      icon: 'flag',
      color: '#F59E0B',
      bgColor: '#F59E0B15',
    },
    { 
      type: 'emi' as InvestmentType, 
      title: 'Loan EMI', 
      subtitle: 'Home/Car',
      icon: 'home',
      color: '#EF4444',
      bgColor: '#EF444415',
    },
  ];

  const handleCalculate = () => {
    try {
      let calculationResults: CalculationResults;

      switch (investmentType) {
        case 'lumpsum':
          const principal = parseFloat(amount);
          const annualRate = parseFloat(rate);
          const timePeriod = parseFloat(years);

          if (isNaN(principal) || isNaN(annualRate) || isNaN(timePeriod)) {
            Alert.alert('Invalid Input', 'Please enter valid numbers for all fields.');
            return;
          }

          calculationResults = calculateInvestmentReturns(principal, annualRate, timePeriod, compoundFrequency);
          break;

        case 'sip':
          const monthly = parseFloat(monthlyAmount);
          const sipRate = parseFloat(rate);
          const sipYears = parseFloat(years);

          if (isNaN(monthly) || isNaN(sipRate) || isNaN(sipYears)) {
            Alert.alert('Invalid Input', 'Please enter valid numbers for all fields.');
            return;
          }

          calculationResults = calculateSIPReturns(monthly, sipRate, sipYears);
          break;

        case 'fd':
          const fdAmount = parseFloat(amount);
          const fdRate = parseFloat(rate);
          const fdYears = parseFloat(years);

          if (isNaN(fdAmount) || isNaN(fdRate) || isNaN(fdYears)) {
            Alert.alert('Invalid Input', 'Please enter valid numbers for all fields.');
            return;
          }

          calculationResults = calculateFDReturns(fdAmount, fdRate, fdYears, compoundFrequency);
          break;

        case 'ppf':
          const ppfMonthly = parseFloat(monthlyAmount);
          const ppfYears = parseFloat(years) || 15;

          if (isNaN(ppfMonthly)) {
            Alert.alert('Invalid Input', 'Please enter valid monthly investment amount.');
            return;
          }

          calculationResults = calculatePPFReturns(ppfMonthly, ppfYears);
          break;

        case 'goal':
          const targetAmount = parseFloat(goalAmount);
          const goalRate = parseFloat(rate);
          const goalYears = parseFloat(years);

          if (isNaN(targetAmount) || isNaN(goalRate) || isNaN(goalYears)) {
            Alert.alert('Invalid Input', 'Please enter valid numbers for all fields.');
            return;
          }

          calculationResults = calculateGoalBasedSIP(targetAmount, goalRate, goalYears);
          break;

        case 'emi':
          const loanAmount = parseFloat(amount);
          const loanRate = parseFloat(rate);
          const loanYears = parseFloat(years);

          if (isNaN(loanAmount) || isNaN(loanRate) || isNaN(loanYears)) {
            Alert.alert('Invalid Input', 'Please enter valid numbers for all fields.');
            return;
          }

          calculationResults = calculateEMI(loanAmount, loanRate, loanYears);
          break;

        default:
          Alert.alert('Error', 'Please select an investment type.');
          return;
      }

      setResults(calculationResults);
    } catch (error) {
      Alert.alert('Error', 'Calculation failed. Please check your inputs and try again.');
    }
  };

  const handleReset = () => {
    setAmount('');
    setMonthlyAmount('');
    setRate('');
    setYears('');
    setGoalAmount('');
    setResults(null);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderInputFields = () => {
    const selectedType = investmentTypes.find(t => t.type === investmentType);
    
    switch (investmentType) {
      case 'lumpsum':
      case 'fd':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Initial Investment Amount
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <Text style={[styles.currencySymbol, { color: selectedType?.color }]}>₹</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="1,00,000"
                  placeholderTextColor={colors.textSecondary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Annual Interest Rate
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder={investmentType === 'fd' ? "6.5" : "12"}
                  placeholderTextColor={colors.textSecondary}
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                />
                <Text style={[styles.percentSymbol, { color: selectedType?.color }]}>%</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Investment Period
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="10"
                  placeholderTextColor={colors.textSecondary}
                  value={years}
                  onChangeText={setYears}
                  keyboardType="numeric"
                />
                <Text style={[styles.unitSymbol, { color: selectedType?.color }]}>years</Text>
              </View>
            </View>

            {investmentType === 'lumpsum' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Compounding Frequency
                </Text>
                <View style={styles.frequencyContainer}>
                  {[
                    { label: 'Monthly', value: 12 },
                    { label: 'Quarterly', value: 4 },
                    { label: 'Annually', value: 1 },
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.frequencyButton,
                        {
                          backgroundColor: compoundFrequency === option.value 
                            ? selectedType?.color 
                            : colors.surface,
                          borderColor: selectedType?.color,
                        }
                      ]}
                      onPress={() => setCompoundFrequency(option.value)}
                    >
                      <Text
                        style={[
                          styles.frequencyText,
                          {
                            color: compoundFrequency === option.value 
                              ? 'white' 
                              : selectedType?.color,
                          }
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        );

      case 'sip':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Monthly Investment
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <Text style={[styles.currencySymbol, { color: selectedType?.color }]}>₹</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="5,000"
                  placeholderTextColor={colors.textSecondary}
                  value={monthlyAmount}
                  onChangeText={setMonthlyAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Expected Annual Return
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="12"
                  placeholderTextColor={colors.textSecondary}
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                />
                <Text style={[styles.percentSymbol, { color: selectedType?.color }]}>%</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Investment Period
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="10"
                  placeholderTextColor={colors.textSecondary}
                  value={years}
                  onChangeText={setYears}
                  keyboardType="numeric"
                />
                <Text style={[styles.unitSymbol, { color: selectedType?.color }]}>years</Text>
              </View>
            </View>
          </>
        );

      case 'ppf':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Monthly Investment
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <Text style={[styles.currencySymbol, { color: selectedType?.color }]}>₹</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="12,500"
                  placeholderTextColor={colors.textSecondary}
                  value={monthlyAmount}
                  onChangeText={setMonthlyAmount}
                  keyboardType="numeric"
                />
              </View>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Maximum ₹1,50,000 per year
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Investment Period
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="15"
                  placeholderTextColor={colors.textSecondary}
                  value={years}
                  onChangeText={setYears}
                  keyboardType="numeric"
                />
                <Text style={[styles.unitSymbol, { color: selectedType?.color }]}>years</Text>
              </View>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Minimum 15 years lock-in, 7.1% fixed rate
              </Text>
            </View>
          </>
        );

      case 'goal':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Target Amount
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <Text style={[styles.currencySymbol, { color: selectedType?.color }]}>₹</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="10,00,000"
                  placeholderTextColor={colors.textSecondary}
                  value={goalAmount}
                  onChangeText={setGoalAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Expected Annual Return
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="12"
                  placeholderTextColor={colors.textSecondary}
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                />
                <Text style={[styles.percentSymbol, { color: selectedType?.color }]}>%</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Time to Achieve Goal
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="10"
                  placeholderTextColor={colors.textSecondary}
                  value={years}
                  onChangeText={setYears}
                  keyboardType="numeric"
                />
                <Text style={[styles.unitSymbol, { color: selectedType?.color }]}>years</Text>
              </View>
            </View>
          </>
        );

      case 'emi':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Loan Amount
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <Text style={[styles.currencySymbol, { color: selectedType?.color }]}>₹</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="50,00,000"
                  placeholderTextColor={colors.textSecondary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Annual Interest Rate
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="8.5"
                  placeholderTextColor={colors.textSecondary}
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                />
                <Text style={[styles.percentSymbol, { color: selectedType?.color }]}>%</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Loan Tenure
              </Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.surface,
                borderColor: selectedType?.color
              }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="20"
                  placeholderTextColor={colors.textSecondary}
                  value={years}
                  onChangeText={setYears}
                  keyboardType="numeric"
                />
                <Text style={[styles.unitSymbol, { color: selectedType?.color }]}>years</Text>
              </View>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const selectedType = investmentTypes.find(t => t.type === investmentType);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerContent}>
            <Pressable
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Investment Calculator
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Plan your financial future
              </Text>
            </View>
            
            <Pressable
              style={[styles.infoButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => setShowInfo(true)}
            >
              <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <Separator height={20} />

        {/* Horizontal Investment Type Selector */}
        <View style={styles.typeSelectorContainer}>
          <Text style={[styles.selectorTitle, { color: colors.text }]}>
            Choose Calculator Type
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
            style={styles.horizontalScroll}
          >
            {investmentTypes.map((type, index) => (
              <Pressable 
                key={type.type}
                style={[
                  styles.typeChip, 
                  {
                    backgroundColor: investmentType === type.type ? type.color : colors.surface,
                    borderColor: type.color,
                    marginLeft: index === 0 ? 20 : 0,
                    marginRight: index === investmentTypes.length - 1 ? 20 : 12,
                  }
                ]}
                onPress={() => {
                  setInvestmentType(type.type);
                  setResults(null);
                }}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={18} 
                  color={investmentType === type.type ? 'white' : type.color} 
                />
                <Text style={[
                  styles.typeChipTitle, 
                  { 
                    color: investmentType === type.type ? 'white' : type.color,
                    marginLeft: 6,
                  }
                ]}>
                  {type.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Separator height={24} />

        {/* Input Section */}
        <Card>
          <View style={styles.inputContainer}>
            <View style={styles.calculatorHeader}>
              <View style={[styles.calculatorIcon, { backgroundColor: selectedType?.bgColor }]}>
                <Ionicons 
                  name={selectedType?.icon as any} 
                  size={24} 
                  color={selectedType?.color} 
                />
              </View>
              <View>
                <Text style={[styles.calculatorTitle, { color: colors.text }]}>
                  {selectedType?.title} Calculator
                </Text>
                <Text style={[styles.calculatorSubtitle, { color: colors.textSecondary }]}>
                  {selectedType?.subtitle} investment planning
                </Text>
              </View>
            </View>

            <Separator height={24} />

            {renderInputFields()}

            <Separator height={32} />

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.calculateButton, { backgroundColor: selectedType?.color }]}
                onPress={handleCalculate}
              >
                <Ionicons name="calculator" size={20} color="white" />
                <Text style={styles.calculateButtonText}>
                  Calculate
                </Text>
              </Pressable>

              <Pressable
                style={[styles.resetButton, { borderColor: colors.textSecondary }]}
                onPress={handleReset}
              >
                <Ionicons name="refresh" size={18} color={colors.textSecondary} />
                <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
                  Reset
                </Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Results Section */}
        {results && (
          <>
            <Separator height={24} />
            <Card>
              <View style={styles.resultsContainer}>
                <View style={styles.resultsHeader}>
                  <Text style={[styles.resultsTitle, { color: colors.text }]}>
                    Your Results
                  </Text>
                  <View style={[styles.resultsBadge, { backgroundColor: selectedType?.bgColor }]}>
                    <Text style={[styles.resultsBadgeText, { color: selectedType?.color }]}>
                      {selectedType?.title}
                    </Text>
                  </View>
                </View>

                <Separator height={20} />

                {investmentType === 'goal' ? (
                  <>
                    <View style={styles.resultRow}>
                      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                        Target Amount
                      </Text>
                      <Text style={[styles.resultValue, { color: colors.text }]}>
                        {formatCurrency(parseFloat(goalAmount) || 0)}
                      </Text>
                    </View>

                    <View style={[styles.resultRow, styles.highlightRow, { backgroundColor: selectedType?.bgColor }]}>
                      <Text style={[styles.resultLabel, { color: selectedType?.color }]}>
                        Required Monthly SIP
                      </Text>
                      <Text style={[styles.resultValue, styles.highlightValue, { color: selectedType?.color }]}>
                        {formatCurrency(results.monthlyAmount || 0)}
                      </Text>
                    </View>

                    <View style={styles.resultRow}>
                      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                        Total Investment
                      </Text>
                      <Text style={[styles.resultValue, { color: colors.text }]}>
                        {formatCurrency(results.totalInvestment)}
                      </Text>
                    </View>
                  </>
                ) : investmentType === 'emi' ? (
                  <>
                    <View style={styles.resultRow}>
                      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                        Loan Amount
                      </Text>
                      <Text style={[styles.resultValue, { color: colors.text }]}>
                        {formatCurrency(results.totalInvestment)}
                      </Text>
                    </View>

                    <View style={[styles.resultRow, styles.highlightRow, { backgroundColor: selectedType?.bgColor }]}>
                      <Text style={[styles.resultLabel, { color: selectedType?.color }]}>
                        Monthly EMI
                      </Text>
                      <Text style={[styles.resultValue, styles.highlightValue, { color: selectedType?.color }]}>
                        {formatCurrency(results.monthlyAmount || 0)}
                      </Text>
                    </View>

                    <View style={styles.resultRow}>
                      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                        Total Payment
                      </Text>
                      <Text style={[styles.resultValue, { color: colors.text }]}>
                        {formatCurrency(results.futureValue)}
                      </Text>
                    </View>

                    <View style={styles.resultRow}>
                      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                        Total Interest
                      </Text>
                      <Text style={[styles.resultValue, { color: selectedType?.color }]}>
                        {formatCurrency(results.totalInterest)}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.resultRow}>
                      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                        {investmentType === 'lumpsum' || investmentType === 'fd' ? 'Initial Investment' : 'Total Investment'}
                      </Text>
                      <Text style={[styles.resultValue, { color: colors.text }]}>
                        {formatCurrency(results.totalInvestment)}
                      </Text>
                    </View>

                    <View style={styles.resultRow}>
                      <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                        Interest Earned
                      </Text>
                      <Text style={[styles.resultValue, { color: '#10B981' }]}>
                        +{formatCurrency(results.totalInterest)}
                      </Text>
                    </View>

                    <View style={[styles.resultRow, styles.highlightRow, { backgroundColor: selectedType?.bgColor }]}>
                      <Text style={[styles.resultLabel, { color: selectedType?.color }]}>
                        {investmentType === 'lumpsum' || investmentType === 'fd' ? 'Maturity Amount' : 'Final Amount'}
                      </Text>
                      <Text style={[styles.resultValue, styles.highlightValue, { color: selectedType?.color }]}>
                        {formatCurrency(results.futureValue)}
                      </Text>
                    </View>

                    <View style={styles.growthBadge}>
                      <Text style={[styles.growthText, { color: selectedType?.color }]}>
                        {((results.futureValue / results.totalInvestment - 1) * 100).toFixed(1)}% Growth
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </Card>
          </>
        )}

        {/* Info Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showInfo}
          onRequestClose={() => setShowInfo(false)}
        >
          <CalculatorInfo onClose={() => setShowInfo(false)} />
        </Modal>

        <Separator height={32} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 32,
  },
  
  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Type Selector Styles
  typeSelectorContainer: {
    marginBottom: 8,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalScrollContent: {
    paddingVertical: 4,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeChipTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Input Section
  inputContainer: {
    padding: 20,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calculatorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calculatorTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  calculatorSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  percentSymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  unitSymbol: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Button Section
  buttonContainer: {
    gap: 12,
  },
  calculateButton: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
    color: 'white',
  },
  resetButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Results Section
  resultsContainer: {
    padding: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  resultsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  highlightRow: {
    paddingVertical: 16,
    borderRadius: 12,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  growthBadge: {
    alignItems: 'center',
    marginTop: 8,
  },
  growthText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default Calculator;
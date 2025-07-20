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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, Section, Separator } from '../components/common';
import { useTheme } from '../contexts/ThemeContext';
import { calculateInvestmentReturns } from '../utils/calculatorUtils';
import CalculatorInfo from './CalculatorInfo';

const Calculator: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [amount, setAmount] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [years, setYears] = useState<string>('');
  const [compoundFrequency, setCompoundFrequency] = useState<number>(12); // Monthly by default
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [results, setResults] = useState<{
    futureValue: number;
    totalInterest: number;
    totalInvestment: number;
  } | null>(null);

  const handleCalculate = () => {
    const principalAmount = parseFloat(amount);
    const annualRate = parseFloat(rate);
    const timePeriod = parseFloat(years);

    if (isNaN(principalAmount) || isNaN(annualRate) || isNaN(timePeriod)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for all fields.');
      return;
    }

    if (principalAmount <= 0 || annualRate <= 0 || timePeriod <= 0) {
      Alert.alert('Invalid Input', 'All values must be greater than zero.');
      return;
    }

    const calculationResults = calculateInvestmentReturns(
      principalAmount,
      annualRate,
      timePeriod,
      compoundFrequency
    );

    setResults(calculationResults);
  };

  const handleReset = () => {
    setAmount('');
    setRate('');
    setYears('');
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

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <Card style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              💰 Investment Calculator
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Calculate your investment returns
            </Text>
          </View>
          
          <Pressable
            style={styles.infoButton}
            onPress={() => setShowInfo(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </Card>

      <Separator height={24} />

      {/* Input Section */}
      <Section 
        title="📊 Investment Details" 
        subtitle="Enter your investment parameters"
      >
        <Card>
          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                💵 Initial Investment Amount (₹)
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.primary + '30',
                  color: colors.text 
                }]}
                placeholder="Enter amount (e.g., 100000)"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <Separator height={16} />

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                📈 Annual Interest Rate (%)
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.primary + '30',
                  color: colors.text 
                }]}
                placeholder="Enter rate (e.g., 12)"
                placeholderTextColor={colors.textSecondary}
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
              />
            </View>

            <Separator height={16} />

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                ⏰ Investment Period (Years)
              </Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.primary + '30',
                  color: colors.text 
                }]}
                placeholder="Enter years (e.g., 10)"
                placeholderTextColor={colors.textSecondary}
                value={years}
                onChangeText={setYears}
                keyboardType="numeric"
              />
            </View>

            <Separator height={20} />

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                🔄 Compounding Frequency
              </Text>
              <View style={styles.frequencyContainer}>
                {[
                  { label: 'Annually', value: 1, icon: '📅' },
                  { label: 'Quarterly', value: 4, icon: '📊' },
                  { label: 'Monthly', value: 12, icon: '🗓️' },
                  { label: 'Daily', value: 365, icon: '⚡' },
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.frequencyButton,
                      {
                        backgroundColor: compoundFrequency === option.value 
                          ? colors.primary 
                          : colors.surface,
                        borderColor: compoundFrequency === option.value 
                          ? colors.primary 
                          : colors.primary + '30',
                      }
                    ]}
                    onPress={() => setCompoundFrequency(option.value)}
                  >
                    <Text style={styles.frequencyIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.frequencyText,
                        {
                          color: compoundFrequency === option.value 
                            ? colors.white 
                            : colors.text,
                        }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Card>
      </Section>

      <Separator height={24} />

      {/* Action Buttons */}
      <Card>
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.calculateButton, { backgroundColor: colors.primary }]}
            onPress={handleCalculate}
          >
            <Ionicons name="calculator" size={20} color={colors.white} />
            <Text style={[styles.calculateButtonText, { color: colors.white }]}>
              Calculate Returns
            </Text>
          </Pressable>

          <Separator height={12} />

          <Pressable
            style={[styles.resetButton, { 
              borderColor: colors.textSecondary,
              backgroundColor: colors.surface 
            }]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
            <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
              Reset Fields
            </Text>
          </Pressable>
        </View>
      </Card>

      {/* Results Section */}
      {results && (
        <>
          <Separator height={24} />
          <Section 
            title="🎯 Investment Results" 
            subtitle="Your investment growth projection"
          >
            <Card>
              <View style={styles.resultsContainer}>
                <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.resultHeader}>
                    <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                    <Text style={[styles.resultTitle, { color: colors.text }]}>
                      Initial Investment
                    </Text>
                  </View>
                  <Text style={[styles.resultValue, { color: colors.textSecondary }]}>
                    {formatCurrency(results.totalInvestment)}
                  </Text>
                </View>

                <Separator height={16} />

                <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.resultHeader}>
                    <Ionicons name="trending-up" size={24} color={colors.success} />
                    <Text style={[styles.resultTitle, { color: colors.text }]}>
                      Interest Earned
                    </Text>
                  </View>
                  <Text style={[styles.resultValue, { color: colors.success }]}>
                    +{formatCurrency(results.totalInterest)}
                  </Text>
                </View>

                <Separator height={16} />

                <View style={[styles.resultCard, styles.futureValueCard, { 
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.primary + '30'
                }]}>
                  <View style={styles.resultHeader}>
                    <Ionicons name="trophy" size={24} color={colors.primary} />
                    <Text style={[styles.resultTitle, styles.futureValueTitle, { color: colors.primary }]}>
                      Future Value
                    </Text>
                  </View>
                  <Text style={[styles.resultValue, styles.futureValueAmount, { color: colors.primary }]}>
                    {formatCurrency(results.futureValue)}
                  </Text>
                  
                  <Separator height={8} />
                  
                  <View style={styles.growthIndicator}>
                    <Text style={[styles.growthText, { color: colors.primary }]}>
                      {((results.futureValue / results.totalInvestment - 1) * 100).toFixed(1)}% Growth
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </Section>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoButton: {
    padding: 8,
  },
  inputContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '48%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  frequencyIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 16,
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  resetButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  resultsContainer: {
    padding: 16,
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  futureValueCard: {
    borderWidth: 2,
  },
  futureValueTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  futureValueAmount: {
    fontSize: 28,
    fontWeight: '800',
  },
  growthIndicator: {
    alignItems: 'center',
  },
  growthText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
});

export default Calculator;
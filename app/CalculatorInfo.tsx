import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Separator } from '../components/common';
import { useTheme } from '../contexts/ThemeContext';

interface CalculatorInfoProps {
  onClose: () => void;
}

const CalculatorInfo: React.FC<CalculatorInfoProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const screenHeight = Dimensions.get('window').height;

  // Theme-aware color schemes for investment types
  const investmentColors = {
    lumpsum: { main: colors.primary, bg: colors.primary + '15' },
    sip: { main: colors.success, bg: colors.success + '15' },
    fd: { main: '#3B82F6', bg: '#3B82F615' },
    ppf: { main: '#059669', bg: '#05966915' },
    goal: { main: colors.warning, bg: colors.warning + '15' },
    emi: { main: '#EF4444', bg: '#EF444415' },
    formula1: { main: colors.primary, bg: colors.primary + '10' },
    formula2: { main: colors.success, bg: colors.success + '10' },
    formula3: { main: '#EF4444', bg: '#EF444410' },
    formula4: { main: '#3B82F6', bg: '#3B82F610' },
    formula5: { main: colors.warning, bg: colors.warning + '10' },
    formula6: { main: colors.accent, bg: colors.accent + '10' },
  };

  const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({ 
    title, 
    children 
  }) => (
    <View style={styles.infoSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const InvestmentCard: React.FC<{ 
    icon: string; 
    title: string; 
    description: string;
    features: string[];
    returns: string;
    risk: string;
    colorKey: keyof typeof investmentColors;
  }> = ({ 
    icon, 
    title, 
    description,
    features,
    returns,
    risk,
    colorKey
  }) => {
    const cardColors = investmentColors[colorKey];
    
    return (
      <Card style={[styles.investmentCard, { backgroundColor: cardColors.bg }]}>
        <View style={styles.investmentHeader}>
          <View style={[styles.investmentIconContainer, { backgroundColor: cardColors.main + '30' }]}>
            <Text style={[styles.investmentIcon, { color: cardColors.main }]}>{icon}</Text>
          </View>
          <View style={styles.investmentTitleContainer}>
            <Text style={[styles.investmentTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.investmentDescription, { color: colors.textSecondary }]}>
              {description}
            </Text>
          </View>
        </View>
        
        <Separator height={12} />
        
        <View style={styles.investmentStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expected Returns</Text>
            <Text style={[styles.statValue, { color: cardColors.main }]}>{returns}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Risk Level</Text>
            <Text style={[styles.statValue, { color: cardColors.main }]}>{risk}</Text>
          </View>
        </View>
        
        <Separator height={12} />
        
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={14} color={cardColors.main} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const FormulaCard: React.FC<{ 
    title: string; 
    formula: string; 
    explanation: string[];
    colorKey: keyof typeof investmentColors;
  }> = ({ title, formula, explanation, colorKey }) => {
    const cardColors = investmentColors[colorKey];
    
    return (
      <Card style={[styles.formulaCard, { backgroundColor: cardColors.bg }]}>
        <Text style={[styles.formulaTitle, { color: colors.text }]}>{title}</Text>
        <View style={[styles.formulaBox, { 
          backgroundColor: cardColors.main + '20',
          borderColor: cardColors.main + '40'
        }]}>
          <Text style={[styles.formulaText, { color: cardColors.main }]}>{formula}</Text>
        </View>
        <Separator height={12} />
        <View style={styles.explanationContainer}>
          {explanation.map((item, index) => (
            <Text key={index} style={[styles.explanationText, { color: colors.textSecondary }]}>
              {item}
            </Text>
          ))}
        </View>
      </Card>
    );
  };

  const ConceptCard: React.FC<{ 
    icon: string; 
    title: string; 
    description: string;
    color: string;
  }> = ({ icon, title, description, color }) => (
    <View style={[styles.conceptCard, { 
      backgroundColor: colors.surface,
      borderColor: colors.primary + '20',
      borderWidth: 1,
    }]}>
      <View style={[styles.conceptIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.conceptTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.conceptDesc, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );

  const TipCard: React.FC<{ 
    tip: string; 
    category: string;
    color: string;
  }> = ({ tip, category, color }) => (
    <View style={[styles.tipCard, { 
      backgroundColor: colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: color,
    }]}>
      <View style={styles.tipHeader}>
        <View style={[styles.tipBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.tipCategory, { color }]}>{category}</Text>
        </View>
      </View>
      <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
    </View>
  );

  return (
    <View style={styles.modalOverlay}>
      <View 
        style={[
          styles.modalContent, 
          { 
            backgroundColor: colors.background,
            maxHeight: screenHeight * 0.95
          }
        ]}
      >
        {/* Header */}
        <View style={[styles.modalHeader, { 
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.primary + '20'
        }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                📊 Complete Investment Guide
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Everything you need to know about investing
              </Text>
            </View>
            <Pressable 
              style={[styles.closeButton, { backgroundColor: colors.primary + '20' }]} 
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Quick Overview */}
          <InfoSection title="🎯 Investment Calculator Overview">
            <Card>
              <View style={styles.sectionContent}>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  Our comprehensive calculator supports 6 investment types to help you make informed financial 
                  decisions. Whether you're planning for retirement, buying a home, or building wealth, 
                  we've got the tools you need.
                </Text>
                
                <Separator height={16} />
                
                <View style={styles.quickStats}>
                  <View style={[styles.quickStatItem, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.quickStatNumber, { color: colors.primary }]}>6</Text>
                    <Text style={[styles.quickStatLabel, { color: colors.primary }]}>Calculators</Text>
                  </View>
                  <View style={[styles.quickStatItem, { backgroundColor: colors.success + '15' }]}>
                    <Text style={[styles.quickStatNumber, { color: colors.success }]}>15+</Text>
                    <Text style={[styles.quickStatLabel, { color: colors.success }]}>Formulas</Text>
                  </View>
                  <View style={[styles.quickStatItem, { backgroundColor: colors.warning + '15' }]}>
                    <Text style={[styles.quickStatNumber, { color: colors.warning }]}>100%</Text>
                    <Text style={[styles.quickStatLabel, { color: colors.warning }]}>Accurate</Text>
                  </View>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={24} />

          {/* Investment Types */}
          <InfoSection title="💰 Investment Types Explained">
            <View style={styles.investmentTypesContainer}>
              <InvestmentCard
                icon="💰"
                title="Lump Sum Investment"
                description="One-time investment with compound growth"
                features={[
                  "Single upfront investment",
                  "Compound interest calculation", 
                  "Flexible tenure options",
                  "Best for large amounts"
                ]}
                returns="8-15% p.a."
                risk="Medium to High"
                colorKey="lumpsum"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="📈"
                title="SIP (Systematic Investment Plan)"
                description="Regular monthly investments for wealth building"
                features={[
                  "Monthly investment discipline",
                  "Rupee cost averaging benefits",
                  "Long-term wealth creation", 
                  "Start with small amounts"
                ]}
                returns="10-15% p.a."
                risk="Medium to High"
                colorKey="sip"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="🏦"
                title="Fixed Deposit (FD)"
                description="Safe bank deposits with guaranteed returns"
                features={[
                  "Capital protection guarantee",
                  "Fixed interest rates",
                  "Quarterly compounding",
                  "Suitable for conservative investors"
                ]}
                returns="5-7% p.a."
                risk="Low"
                colorKey="fd"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="🛡️"
                title="PPF (Public Provident Fund)"
                description="Tax-saving long-term investment scheme"
                features={[
                  "15-year lock-in period",
                  "Tax deduction under 80C",
                  "Tax-free returns",
                  "Current rate: 7.1% p.a."
                ]}
                returns="7.1% p.a."
                risk="Very Low"
                colorKey="ppf"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="🎯"
                title="Goal-Based Planning"
                description="Calculate SIP needed for financial goals"
                features={[
                  "Target-based calculations",
                  "Required monthly SIP",
                  "Timeline planning",
                  "Dream to reality mapping"
                ]}
                returns="Varies"
                risk="Depends on choice"
                colorKey="goal"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="🏠"
                title="Loan EMI Calculator"
                description="Calculate loan EMIs and total interest"
                features={[
                  "Monthly EMI calculation",
                  "Total interest payable",
                  "Loan amortization",
                  "Home, car, personal loans"
                ]}
                returns="N/A (Cost)"
                risk="Interest Rate Risk"
                colorKey="emi"
              />
            </View>
          </InfoSection>

          <Separator height={24} />

          {/* Key Formulas */}
          <InfoSection title="🧮 Essential Investment Formulas">
            <View style={styles.formulasContainer}>
              <FormulaCard
                title="Compound Interest"
                formula="A = P(1 + r/n)^(nt)"
                explanation={[
                  "A = Final amount",
                  "P = Principal (initial investment)", 
                  "r = Annual interest rate (decimal)",
                  "n = Compounding frequency per year",
                  "t = Time in years"
                ]}
                colorKey="formula1"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="SIP Future Value"
                formula="FV = PMT × [((1 + r)^n - 1) / r]"
                explanation={[
                  "FV = Future value of SIP",
                  "PMT = Monthly payment amount",
                  "r = Monthly interest rate",
                  "n = Total number of payments"
                ]}
                colorKey="formula2"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="EMI Calculation"
                formula="EMI = P × r × (1+r)^n / [(1+r)^n-1]"
                explanation={[
                  "EMI = Equated Monthly Installment",
                  "P = Principal loan amount",
                  "r = Monthly interest rate",
                  "n = Number of monthly installments"
                ]}
                colorKey="formula3"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="Simple Interest"
                formula="SI = P × r × t"
                explanation={[
                  "SI = Simple interest earned",
                  "P = Principal amount",
                  "r = Annual interest rate (decimal)",
                  "t = Time period in years"
                ]}
                colorKey="formula4"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="Real Rate of Return"
                formula="Real Rate = (1 + Nominal Rate) / (1 + Inflation) - 1"
                explanation={[
                  "Adjusts returns for inflation impact",
                  "Nominal Rate = Stated investment return",
                  "Inflation = Annual inflation rate",
                  "Real Rate = Actual purchasing power gain"
                ]}
                colorKey="formula5"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="Rule of 72"
                formula="Years to Double = 72 / Interest Rate"
                explanation={[
                  "Quick way to estimate doubling time",
                  "Interest Rate = Annual return percentage",
                  "Example: At 12%, money doubles in 6 years",
                  "Useful for quick mental calculations"
                ]}
                colorKey="formula6"
              />
            </View>
          </InfoSection>

          <Separator height={24} />

          {/* Financial Concepts */}
          <InfoSection title="📚 Key Financial Concepts">
            <Card>
              <View style={styles.sectionContent}>
                <View style={styles.conceptsGrid}>
                  <ConceptCard
                    icon="trending-up"
                    title="Compound Interest"
                    description="Interest earned on both principal and previously earned interest. The foundation of wealth building."
                    color={colors.success}
                  />
                  
                  <ConceptCard
                    icon="repeat"
                    title="Rupee Cost Averaging"
                    description="Investing fixed amounts regularly reduces the impact of market volatility over time."
                    color={colors.primary}
                  />
                  
                  <ConceptCard
                    icon="shield-checkmark"
                    title="Risk vs Return"
                    description="Higher potential returns usually come with higher risk. Balance is key to successful investing."
                    color={colors.warning}
                  />
                  
                  <ConceptCard
                    icon="time"
                    title="Time Value of Money"
                    description="Money today is worth more than the same amount in the future due to earning potential."
                    color={colors.accent}
                  />
                  
                  <ConceptCard
                    icon="pie-chart"
                    title="Diversification"
                    description="Spreading investments across different assets to reduce overall portfolio risk."
                    color={colors.primary}
                  />
                  
                  <ConceptCard
                    icon="calculator"
                    title="Asset Allocation"
                    description="Strategic distribution of investments among different asset categories like stocks, bonds, cash."
                    color={colors.success}
                  />
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={24} />

          {/* Investment Strategies */}
          <InfoSection title="🎯 Smart Investment Strategies">
            <View style={styles.strategiesContainer}>
              <TipCard
                category="Beginner"
                tip="Start with small amounts in SIPs to build investment discipline. Begin with equity mutual funds for long-term growth."
                color={colors.success}
              />
              
              <TipCard
                category="Emergency Fund"
                tip="Keep 6-12 months of expenses in liquid investments like savings accounts or liquid funds before investing elsewhere."
                color={colors.warning}
              />
              
              <TipCard
                category="Goal-Based"
                tip="Define specific financial goals (house, car, retirement) and choose appropriate investment vehicles for each timeline."
                color={colors.primary}
              />
              
              <TipCard
                category="Tax Planning"
                tip="Use tax-saving investments like PPF, ELSS, and life insurance to reduce tax liability under Section 80C."
                color={colors.accent}
              />
              
              <TipCard
                category="Risk Management"
                tip="Diversify across asset classes and sectors. Don't put all eggs in one basket - spread your investments."
                color={colors.primary}
              />
              
              <TipCard
                category="Long-term"
                tip="Stay invested for the long term. Market timing is difficult - time in the market beats timing the market."
                color={colors.success}
              />
            </View>
          </InfoSection>

          <Separator height={24} />

          {/* Expected Returns Guide */}
          <InfoSection title="📊 Investment Returns Guide">
            <Card>
              <View style={styles.sectionContent}>
                <View style={[styles.returnsTable, { 
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.primary + '20'
                }]}>
                  <View style={[styles.returnsHeader, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.returnsHeaderText, { color: colors.text }]}>Investment</Text>
                    <Text style={[styles.returnsHeaderText, { color: colors.text }]}>Returns</Text>
                    <Text style={[styles.returnsHeaderText, { color: colors.text }]}>Risk</Text>
                    <Text style={[styles.returnsHeaderText, { color: colors.text }]}>Liquidity</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Savings Account</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>3-4%</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Very Low</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>High</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Fixed Deposits</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>5-7%</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Low</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Medium</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>PPF</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>7.1%</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Very Low</Text>
                    <Text style={[styles.returnsCell, { color: colors.error || '#EF4444' }]}>Low</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Debt Mutual Funds</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>6-9%</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Low-Medium</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>High</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Equity Mutual Funds</Text>
                    <Text style={[styles.returnsCell, { color: colors.primary }]}>10-15%</Text>
                    <Text style={[styles.returnsCell, { color: colors.error || '#EF4444' }]}>High</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>High</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Direct Stocks</Text>
                    <Text style={[styles.returnsCell, { color: colors.primary }]}>12-18%</Text>
                    <Text style={[styles.returnsCell, { color: colors.error || '#EF4444' }]}>Very High</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>High</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Real Estate</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>8-12%</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Medium</Text>
                    <Text style={[styles.returnsCell, { color: colors.error || '#EF4444' }]}>Very Low</Text>
                  </View>
                  
                  <View style={styles.returnsRow}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Gold</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>6-10%</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Medium</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Medium</Text>
                  </View>
                </View>
                
                <Separator height={16} />
                
                <View style={[styles.disclaimerBox, { backgroundColor: colors.warning + '10' }]}>
                  <Ionicons name="information-circle" size={16} color={colors.warning} />
                  <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                    Returns are historical averages and not guaranteed. Past performance doesn't indicate future results.
                  </Text>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={24} />

          {/* Tax Implications */}
          <InfoSection title="💸 Tax Implications & Planning">
            <Card>
              <View style={styles.sectionContent}>
                <View style={styles.taxContainer}>
                  <View style={[styles.taxCard, { 
                    backgroundColor: colors.success + '10',
                    borderColor: colors.success + '30',
                    borderWidth: 1,
                  }]}>
                    <Text style={[styles.taxTitle, { color: colors.success }]}>Tax-Free Investments</Text>
                    <Text style={[styles.taxDesc, { color: colors.textSecondary }]}>
                      PPF, EPF, Life Insurance, ELSS (after 3 years), NSC
                    </Text>
                  </View>
                  
                  <View style={[styles.taxCard, { 
                    backgroundColor: colors.warning + '10',
                    borderColor: colors.warning + '30',
                    borderWidth: 1,
                  }]}>
                    <Text style={[styles.taxTitle, { color: colors.warning }]}>Tax-Deductible (80C)</Text>
                    <Text style={[styles.taxDesc, { color: colors.textSecondary }]}>
                      PPF, ELSS, Life Insurance, NSC, FD (5-year), Home Loan Principal
                    </Text>
                  </View>
                  
                  <View style={[styles.taxCard, { 
                    backgroundColor: (colors.error || '#EF4444') + '10',
                    borderColor: (colors.error || '#EF4444') + '30',
                    borderWidth: 1,
                  }]}>
                    <Text style={[styles.taxTitle, { color: colors.error || '#EF4444' }]}>Taxable Investments</Text>
                    <Text style={[styles.taxDesc, { color: colors.textSecondary }]}>
                      FD Interest, Mutual Fund Gains, Stock Trading, Real Estate
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={24} />

          {/* Important Disclaimers */}
          <InfoSection title="⚠️ Important Disclaimers">
            <Card>
              <View style={[styles.warningBox, { 
                backgroundColor: (colors.error || '#EF4444') + '10',
                borderColor: (colors.error || '#EF4444') + '30'
              }]}>
                <Ionicons name="warning" size={20} color={colors.error || '#EF4444'} style={styles.warningIcon} />
                <View style={styles.warningContent}>
                  <Text style={[styles.warningTitle, { color: colors.error || '#EF4444' }]}>
                    Investment Risk Notice
                  </Text>
                  <Text style={[styles.warningText, { color: colors.text }]}>
                    • All calculations are estimates based on your inputs{'\n'}
                    • Market investments are subject to market risks{'\n'}
                    • Past performance doesn't guarantee future results{'\n'}
                    • Consider consulting a financial advisor for personalized advice{'\n'}
                    • Inflation may affect real returns over time{'\n'}
                    • Diversification helps but doesn't eliminate risk{'\n'}
                    • Start early and invest regularly for best results
                  </Text>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={40} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  infoSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  sectionContent: {
    padding: 16,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  // Investment Cards
  investmentTypesContainer: {
    gap: 0,
  },
  investmentCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  investmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  investmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  investmentIcon: {
    fontSize: 20,
  },
  investmentTitleContainer: {
    flex: 1,
  },
  investmentTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  investmentDescription: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  investmentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  featuresContainer: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },

  // Formula Cards
  formulasContainer: {
    gap: 0,
  },
  formulaCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  formulaTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  formulaBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  formulaText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  explanationContainer: {
    gap: 4,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    fontFamily: 'monospace',
  },

  // Concept Cards
  conceptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conceptCard: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  conceptIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  conceptTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  conceptDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },

  // Strategy Tips
  strategiesContainer: {
    gap: 12,
  },
  tipCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipHeader: {
    marginBottom: 8,
  },
  tipBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tipCategory: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Returns Table
  returnsTable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  returnsHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  returnsHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  returnsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
  },
  returnsCell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Tax Section
  taxContainer: {
    gap: 12,
  },
  taxCard: {
    padding: 14,
    borderRadius: 12,
  },
  taxTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  taxDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Disclaimers
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
  },
  disclaimerText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default CalculatorInfo;
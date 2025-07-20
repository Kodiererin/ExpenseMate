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

  const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({ 
    title, 
    children 
  }) => (
    <View style={styles.infoSection}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
      {children}
    </View>
  );

  const InfoItem: React.FC<{ 
    icon: string; 
    label: string; 
    description: string;
    color?: string;
  }> = ({ 
    icon, 
    label, 
    description,
    color = colors.primary
  }) => (
    <View style={[styles.infoItem, { backgroundColor: colors.surface }]}>
      <View style={styles.infoHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );

  const TipItem: React.FC<{ tip: string }> = ({ tip }) => (
    <View style={styles.tipItem}>
      <Ionicons 
        name="checkmark-circle" 
        size={18} 
        color={colors.success} 
        style={styles.tipIcon} 
      />
      <Text style={[styles.tipText, { color: colors.text }]}>
        {tip}
      </Text>
    </View>
  );

  return (
    <View style={styles.modalOverlay}>
      <View 
        style={[
          styles.modalContent, 
          { 
            backgroundColor: colors.background,
            maxHeight: screenHeight * 0.90
          }
        ]}
      >
        {/* Header */}
        <Card style={styles.modalHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                💰 Investment Calculator Guide
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Everything you need to know
              </Text>
            </View>
            <Pressable 
              style={[styles.closeButton, { backgroundColor: colors.surface }]} 
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </Card>

        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* How It Works */}
          <InfoSection title="🎯 How It Works">
            <Card>
              <View style={styles.sectionContent}>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  This calculator uses the compound interest formula to estimate how your investments 
                  can grow over time. Enter your initial amount, expected annual return, and time 
                  period to see the power of compounding in action!
                </Text>
              </View>
            </Card>
          </InfoSection>

          <Separator height={20} />

          {/* Key Terms */}
          <InfoSection title="📚 Key Terms">
            <View style={styles.itemsContainer}>
              <InfoItem
                icon="wallet-outline"
                label="Initial Investment"
                description="The principal amount you plan to invest upfront. This is your starting capital."
                color={colors.primary}
              />
              
              <Separator height={12} />
              
              <InfoItem
                icon="trending-up-outline"
                label="Annual Interest Rate"
                description="Expected yearly return percentage. Stock markets historically average 7-12% annually."
                color={colors.success}
              />
              
              <Separator height={12} />
              
              <InfoItem
                icon="time-outline"
                label="Investment Period"
                description="Duration you plan to keep money invested. Longer periods amplify compound growth."
                color={colors.warning}
              />
              
              <Separator height={12} />
              
              <InfoItem
                icon="refresh-outline"
                label="Compounding Frequency"
                description="How often returns are reinvested. More frequent compounding means higher growth."
                color={colors.accent}
              />
            </View>
          </InfoSection>

          <Separator height={20} />

          {/* Compounding Options */}
          <InfoSection title="🔄 Compounding Frequencies">
            <Card>
              <View style={styles.sectionContent}>
                <View style={styles.compoundingGrid}>
                  <View style={[styles.compoundingItem, { backgroundColor: colors.surface }]}>
                    <Text style={styles.compoundingIcon}>📅</Text>
                    <Text style={[styles.compoundingTitle, { color: colors.text }]}>Annually</Text>
                    <Text style={[styles.compoundingDesc, { color: colors.textSecondary }]}>
                      Once per year
                    </Text>
                  </View>
                  
                  <View style={[styles.compoundingItem, { backgroundColor: colors.surface }]}>
                    <Text style={styles.compoundingIcon}>📊</Text>
                    <Text style={[styles.compoundingTitle, { color: colors.text }]}>Quarterly</Text>
                    <Text style={[styles.compoundingDesc, { color: colors.textSecondary }]}>
                      Every 3 months
                    </Text>
                  </View>
                  
                  <View style={[styles.compoundingItem, { backgroundColor: colors.surface }]}>
                    <Text style={styles.compoundingIcon}>🗓️</Text>
                    <Text style={[styles.compoundingTitle, { color: colors.text }]}>Monthly</Text>
                    <Text style={[styles.compoundingDesc, { color: colors.textSecondary }]}>
                      Most common for SIPs
                    </Text>
                  </View>
                  
                  <View style={[styles.compoundingItem, { backgroundColor: colors.surface }]}>
                    <Text style={styles.compoundingIcon}>⚡</Text>
                    <Text style={[styles.compoundingTitle, { color: colors.text }]}>Daily</Text>
                    <Text style={[styles.compoundingDesc, { color: colors.textSecondary }]}>
                      Maximum growth
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={20} />

          {/* Investment Tips */}
          <InfoSection title="💡 Investment Tips">
            <Card>
              <View style={styles.sectionContent}>
                <TipItem tip="Start investing early to maximize the power of compound interest" />
                <TipItem tip="Diversify your portfolio across different asset classes and sectors" />
                <TipItem tip="Use SIP (Systematic Investment Plan) to reduce market timing risks" />
                <TipItem tip="Consider inflation when setting your expected return expectations" />
                <TipItem tip="Review and rebalance your portfolio annually for optimal performance" />
                <TipItem tip="Stay invested for the long term to ride out market volatility" />
              </View>
            </Card>
          </InfoSection>

          <Separator height={20} />

          {/* Formula */}
          <InfoSection title="🧮 The Math Behind It">
            <Card>
              <View style={styles.sectionContent}>
                <Text style={[styles.formulaTitle, { color: colors.text }]}>
                  Compound Interest Formula:
                </Text>
                
                <Separator height={12} />
                
                <View style={[styles.formulaBox, { 
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.primary + '30'
                }]}>
                  <Text style={[styles.formulaText, { color: colors.primary }]}>
                    A = P(1 + r/n)^(nt)
                  </Text>
                </View>
                
                <Separator height={16} />
                
                <View style={styles.formulaExplanation}>
                  <View style={styles.formulaItem}>
                    <Text style={[styles.formulaVariable, { color: colors.primary }]}>A</Text>
                    <Text style={[styles.formulaDescription, { color: colors.textSecondary }]}>
                      = Final amount (Future Value)
                    </Text>
                  </View>
                  <View style={styles.formulaItem}>
                    <Text style={[styles.formulaVariable, { color: colors.primary }]}>P</Text>
                    <Text style={[styles.formulaDescription, { color: colors.textSecondary }]}>
                      = Principal (Initial investment)
                    </Text>
                  </View>
                  <View style={styles.formulaItem}>
                    <Text style={[styles.formulaVariable, { color: colors.primary }]}>r</Text>
                    <Text style={[styles.formulaDescription, { color: colors.textSecondary }]}>
                      = Annual interest rate (as decimal)
                    </Text>
                  </View>
                  <View style={styles.formulaItem}>
                    <Text style={[styles.formulaVariable, { color: colors.primary }]}>n</Text>
                    <Text style={[styles.formulaDescription, { color: colors.textSecondary }]}>
                      = Compounding frequency per year
                    </Text>
                  </View>
                  <View style={styles.formulaItem}>
                    <Text style={[styles.formulaVariable, { color: colors.primary }]}>t</Text>
                    <Text style={[styles.formulaDescription, { color: colors.textSecondary }]}>
                      = Time period in years
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={20} />

          {/* Important Note */}
          <InfoSection title="⚠️ Important Disclaimer">
            <Card>
              <View style={[styles.warningBox, { 
                backgroundColor: colors.warning + '10',
                borderColor: colors.warning + '30'
              }]}>
                <Ionicons name="warning" size={20} color={colors.warning} style={styles.warningIcon} />
                <View style={styles.warningContent}>
                  <Text style={[styles.warningTitle, { color: colors.warning }]}>
                    Investment Risk Notice
                  </Text>
                  <Text style={[styles.warningText, { color: colors.text }]}>
                    This calculator provides estimates based on your inputs. Actual investment 
                    returns may vary due to market conditions, fees, and other factors. 
                    Past performance doesn't guarantee future results.
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    margin: 0,
    marginBottom: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionContent: {
    padding: 16,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  itemsContainer: {
    gap: 0,
  },
  infoItem: {
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  compoundingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  compoundingItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  compoundingIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  compoundingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  compoundingDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  formulaTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  formulaBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  formulaText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  formulaExplanation: {
    gap: 8,
  },
  formulaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formulaVariable: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    width: 20,
  },
  formulaDescription: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default CalculatorInfo;
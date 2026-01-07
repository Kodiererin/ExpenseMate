import React from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ChartProps {
  children: React.ReactNode;
}

export const ZoomableChart: React.FC<ChartProps> = ({
  children,
}) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
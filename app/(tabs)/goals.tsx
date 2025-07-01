import { View, Text, StyleSheet } from 'react-native';

export default function GoalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Goals</Text>
      {/* You can allow setting monthly limits, etc. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
});

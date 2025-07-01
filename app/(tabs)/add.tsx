import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function AddScreen() {
  const [tag, setTag] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const today = new Date().toLocaleDateString();

  const handleAdd = () => {
    console.log({ tag, price, description, date: today });
    // Handle saving the expense
    setTag('');
    setPrice('');
    setDescription('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ExpenseMate</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Tag"
          value={tag}
          onChangeText={setTag}
        />
        <TextInput
          style={styles.input}
          placeholder="Price"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
      </View>
      <Text style={styles.date}>{today}</Text>
      <Button title="Add" onPress={handleAdd} />
      <TextInput
        style={styles.descInput}
        placeholder="Add Description (if any)"
        value={description}
        onChangeText={setDescription}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  input: { flex: 0.48, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  date: { textAlign: 'center', marginVertical: 8, fontSize: 16 },
  descInput: { marginTop: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
});

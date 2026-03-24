import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Featured Exhibitions</Text>
      <Text style={styles.subtitle}>Open Today: 10:00 AM - 5:00 PM</Text>
      <Button title="Open Menu" onPress={() => navigation.openDrawer()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: 'gray', marginBottom: 20 },
});

export default HomeScreen;

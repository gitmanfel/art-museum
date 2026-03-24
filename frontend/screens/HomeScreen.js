import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation, route }) => {
  const setToken = route.params?.setToken;

  const handleLogout = () => {
    if (setToken) {
      setToken(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Featured Exhibitions Loading...</Text>
      <Text style={styles.info}>Open Today: 10:00 AM - 5:00 PM</Text>

      <View style={styles.buttonContainer}>
        <Button title="Open Menu" onPress={() => navigation.openDrawer()} />
      </View>

      <View style={styles.logoutContainer}>
        <Button title="Logout" onPress={handleLogout} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 20, marginBottom: 20 },
  info: { fontSize: 16, color: 'gray', marginBottom: 40 },
  buttonContainer: {
    marginBottom: 20,
    width: '100%',
    maxWidth: 200,
  },
  logoutContainer: {
    marginTop: 40,
    width: '100%',
    maxWidth: 200,
  }
});

export default HomeScreen;

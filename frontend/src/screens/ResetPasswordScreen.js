import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { resetPassword } from '../services/auth';

const isStrongPassword = (value) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/.test(value);
};

const ResetPasswordScreen = ({ navigation, route }) => {
  const initialToken = route?.params?.token || '';
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    if (!token || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setError('Password must be at least 10 characters and include uppercase, lowercase, number, and special character');
      setLoading(false);
      return;
    }

    const result = await resetPassword(token, newPassword);
    if (result.success) {
      setMessage(result.message || 'Password reset successful');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 800);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RESET PASSWORD</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {message ? <Text style={styles.messageText}>{message}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Reset token"
        placeholderTextColor="#aaa"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor="#aaa"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        placeholderTextColor="#aaa"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Text style={styles.hintText}>
        Use 10+ characters with upper/lowercase, a number, and a special character.
      </Text>

      <TouchableOpacity style={styles.resetButton} onPress={handleReset} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.resetButtonText}>Reset Password</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.backText}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  hintText: {
    color: '#bbb',
    fontSize: 11,
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#ff4c4c',
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  errorText: {
    color: '#ff4c4c',
    marginBottom: 10,
    textAlign: 'center',
  },
  messageText: {
    color: '#7ad97a',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ResetPasswordScreen;

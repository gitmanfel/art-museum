import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { register } from '../services/auth';
import { useAuth } from '../context/AuthContext';

const isStrongPassword = (value) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/.test(value);
};

const RegisterScreen = ({ navigation }) => {
  const webPress = (handler) => (Platform.OS === 'web' ? { onClick: handler } : {});
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!isStrongPassword(password)) {
      setError('Password must be at least 10 characters and include uppercase, lowercase, number, and special character');
      setLoading(false);
      return;
    }

    const result = await register(email, password);

    if (result.success) {
      await refreshProfile();
      navigation.replace('Main');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CREATE ACCOUNT</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.hintText}>
        Use 10+ characters with upper/lowercase, a number, and a special character.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor="#aaa"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Pressable
        style={styles.registerButton}
        onPress={handleRegister}
        disabled={loading}
        {...webPress(handleRegister)}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.registerButtonText}>Create Account</Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')} {...webPress(() => navigation.navigate('Login'))}>
        <Text style={styles.loginText}>Already have an account?</Text>
      </Pressable>
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
    borderRadius: 0,
  },
  registerButton: {
    backgroundColor: '#ff4c4c',
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  errorText: {
    color: '#ff4c4c',
    marginBottom: 10,
    textAlign: 'center',
  },
  hintText: {
    color: '#bbb',
    fontSize: 11,
    marginBottom: 10,
  },
});

export default RegisterScreen;

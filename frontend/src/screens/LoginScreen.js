import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { login, forgotPassword } from '../services/auth';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleForgotPassword = async () => {
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email first.');
      return;
    }

    const result = await forgotPassword(email);
    if (result.success) {
      setMessage(result.message);
      if (result.resetToken) {
        navigation.navigate('ResetPassword', { email, token: result.resetToken });
      }
    } else {
      setError(result.error);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    if (!email || !password) {
        setError('Please enter both email and password.');
        setLoading(false);
        return;
    }

    const result = await login(email, password);

    if (result.success) {
      await refreshProfile();
        // Successful login, navigate to the Main app flow (Drawer)
        navigation.replace('Main');
    } else {
        setError(result.error);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YOUR ART MUSEUM</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {message ? <Text style={styles.messageText}>{message}</Text> : null}
      
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
      
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPassword}>Forgot your password?</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
      >
        {loading ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={styles.loginButtonText}>Log In</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>Don't have an account?</Text>
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
    borderRadius: 0,
  },
  forgotPassword: {
    color: '#fff',
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 12,
  },
  loginButton: {
    backgroundColor: '#ff4c4c', 
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerText: {
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
    fontSize: 12,
  },
});

export default LoginScreen;

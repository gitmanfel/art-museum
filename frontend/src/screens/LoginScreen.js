import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { login, forgotPassword } from '../services/auth';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { refreshProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const webPress = (handler) => (Platform.OS === 'web' ? { onClick: handler } : {});

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

  const containerPadding = isCompact ? 16 : 20;
  const titleSize = isCompact ? 24 : isWide ? 32 : 28;
  const containerMaxWidth = isWide ? 420 : '100%';
  
  return (
    <View style={[styles.container, { paddingHorizontal: containerPadding }]}>
      <View style={[styles.innerContainer, isWide && { maxWidth: containerMaxWidth, alignSelf: 'center' }]}>
        <Text style={[styles.title, { fontSize: titleSize, marginBottom: isCompact ? 30 : 40 }]}>YOUR ART MUSEUM</Text>
        
        {error ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>
        ) : null}
        {message ? (
          <Text style={styles.messageText} accessibilityLiveRegion="polite">{message}</Text>
        ) : null}
        
        <TextInput
          style={[styles.input, { marginBottom: isCompact ? 8 : 10 }]}
          placeholder="Email address"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email address input"
          accessibilityHint="Enter your email to log in"
        />
        
        <TextInput
          style={[styles.input, { marginBottom: isCompact ? 14 : 16 }]}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password input"
          accessibilityHint="Enter your password"
        />
        
        <Pressable onPress={handleForgotPassword} {...webPress(handleForgotPassword)} accessibilityRole="button" accessibilityLabel="Forgot your password">
          <Text style={[styles.forgotPassword, { marginBottom: isCompact ? 16 : 20 }]}>Forgot your password?</Text>
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [styles.loginButton, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
          {...webPress(handleLogin)}
          accessibilityRole="button"
          accessibilityLabel="Log in button"
          accessibilityHint="Signs you into your account"
        >
          {loading ? (
              <ActivityIndicator color="#fff" />
          ) : (
              <Text style={[styles.loginButtonText, { fontSize: isCompact ? 14 : 16 }]}>Log In</Text>
          )}
        </Pressable>
        
        <Pressable onPress={() => navigation.navigate('Register')} {...webPress(() => navigation.navigate('Register'))} accessibilityRole="button" accessibilityLabel="Create account">
          <Text style={[styles.registerText, { fontSize: isCompact ? 11 : 12 }]}>Don't have an account?</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#000', 
  },
  innerContainer: {
    width: '100%',
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
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

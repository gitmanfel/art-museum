import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { register } from '../services/auth';
import { useAuth } from '../context/AuthContext';

const isStrongPassword = (value) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/.test(value);
};

const RegisterScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
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

  const containerPadding = isCompact ? 16 : 20;
  const titleSize = isCompact ? 24 : isWide ? 32 : 28;
  const containerMaxWidth = isWide ? 420 : '100%';

  return (
    <View style={[styles.container, { paddingHorizontal: containerPadding }]}>
      <View style={[styles.innerContainer, isWide && { maxWidth: containerMaxWidth, alignSelf: 'center' }]}>
        <Text style={[styles.title, { fontSize: titleSize, marginBottom: isCompact ? 30 : 40 }]}>CREATE ACCOUNT</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={[styles.input, { marginBottom: isCompact ? 8 : 10 }]}
          placeholder="Email address"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email address input"
          accessibilityHint="Enter your email to create account"
        />

        <TextInput
          style={[styles.input, { marginBottom: isCompact ? 8 : 10 }]}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password input"
          accessibilityHint="Create a strong password with 10+ characters"
        />

        <Text style={[styles.hintText, { marginBottom: isCompact ? 8 : 10 }]}>
          Use 10+ characters with upper/lowercase, a number, and a special character.
        </Text>

        <TextInput
          style={[styles.input, { marginBottom: isCompact ? 14 : 16 }]}
          placeholder="Confirm password"
          placeholderTextColor="#aaa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          accessibilityLabel="Confirm password input"
          accessibilityHint="Re-enter your password"
        />

        <Pressable
          style={({ pressed }) => [styles.registerButton, { marginBottom: isCompact ? 12 : 15, opacity: pressed ? 0.85 : 1 }]}
          onPress={handleRegister}
          disabled={loading}
          {...webPress(handleRegister)}
          accessibilityRole="button"
          accessibilityLabel="Create account button"
          accessibilityHint="Creates your account with the provided credentials"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.registerButtonText, { fontSize: isCompact ? 14 : 16 }]}>Create Account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} {...webPress(() => navigation.navigate('Login'))} accessibilityRole="button" accessibilityLabel="Log in">
          <Text style={[styles.loginText, { fontSize: isCompact ? 11 : 12 }]}>Already have an account?</Text>
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

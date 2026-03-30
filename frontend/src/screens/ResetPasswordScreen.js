import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { resetPassword } from '../services/auth';

const isStrongPassword = (value) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/.test(value);
};

const ResetPasswordScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
  const webPress = (handler) => (Platform.OS === 'web' ? { onClick: handler } : {});
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

  const containerPadding = isCompact ? 16 : 20;
  const titleSize = isCompact ? 24 : isWide ? 32 : 28;
  const containerMaxWidth = isWide ? 420 : '100%';

  return (
    <View style={[styles.container, { paddingHorizontal: containerPadding }]}>
      <View style={[styles.innerContainer, isWide && { maxWidth: containerMaxWidth, alignSelf: 'center' }]}>
        <Text style={[styles.title, { fontSize: titleSize, marginBottom: isCompact ? 30 : 40 }]}>RESET PASSWORD</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.messageText}>{message}</Text> : null}

        <TextInput
          style={[styles.input, { marginBottom: isCompact ? 8 : 10 }]}
          placeholder="Reset token"
          placeholderTextColor="#aaa"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          accessibilityLabel="Reset token input"
          accessibilityHint="Enter the reset token from your email"
        />

        <TextInput
          style={[styles.input, { marginBottom: isCompact ? 8 : 10 }]}
          placeholder="New password"
          placeholderTextColor="#aaa"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          accessibilityLabel="New password input"
          accessibilityHint="Create a strong password with 10+ characters"
        />

        <TextInput
          style={[styles.input, { marginBottom: isCompact ? 8 : 10 }]}
          placeholder="Confirm new password"
          placeholderTextColor="#aaa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          accessibilityLabel="Confirm password input"
          accessibilityHint="Re-enter your new password"
        />

        <Text style={[styles.hintText, { marginBottom: isCompact ? 14 : 16 }]}>
          Use 10+ characters with upper/lowercase, a number, and a special character.
        </Text>

        <Pressable 
          style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.85 : 1 }]} 
          onPress={handleReset} 
          disabled={loading} 
          {...webPress(handleReset)}
          accessibilityRole="button"
          accessibilityLabel="Reset password button"
          accessibilityHint="Resets your password with the new credentials"
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.resetButtonText, { fontSize: isCompact ? 14 : 16 }]}>Reset Password</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} {...webPress(() => navigation.navigate('Login'))} accessibilityRole="button" accessibilityLabel="Back to login">
          <Text style={[styles.backText, { fontSize: isCompact ? 11 : 12 }]}>Back to login</Text>
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

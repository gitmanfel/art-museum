import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { useAuth } from '../AuthContext';

const API_URL = 'http://10.0.2.2:5000/api';
// Normally you would load this key from your environment variables:
const STRIPE_PUBLISHABLE_KEY = 'pk_test_placeholder_key_here';

const CheckoutForm = ({ route, navigation }) => {
  const { amount, title, onSuccessNavigateTo, successMessage } = route.params;
  const { token } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  const fetchPaymentIntentClientSecret = async () => {
    try {
      const response = await fetch(`${API_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, currency: 'usd' }),
      });
      const data = await response.json();
      return data.clientSecret;
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to reach the payment server.');
      return null;
    }
  };

  const initializePaymentSheet = async () => {
    setLoading(true);
    const clientSecret = await fetchPaymentIntentClientSecret();

    if (!clientSecret) {
      setLoading(false);
      return;
    }

    if (clientSecret === "pi_mock_secret_for_sandbox") {
        // Special case for sandbox without real keys
        setLoading(false);
        return;
    }

    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Art Museum App',
      allowsDelayedPaymentMethods: true,
    });

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    }
    setLoading(false);
  };

  const openPaymentSheet = async () => {
    setLoading(true);

    // Sandbox Mock Mode: Because we are using placeholder Stripe keys, real Stripe SDK calls will fail.
    // We mock the successful payment response to allow you to continue testing the app logic!
    const isMockSandbox = STRIPE_PUBLISHABLE_KEY.includes('placeholder');
    if (isMockSandbox) {
        setTimeout(() => {
            Alert.alert('Success (Mocked)', successMessage || 'Payment successful!');
            setLoading(false);
            if (onSuccessNavigateTo) {
                navigation.navigate(onSuccessNavigateTo);
            } else {
                navigation.goBack();
            }
        }, 1500);
        return;
    }

    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      Alert.alert('Success', successMessage || 'Your payment was successful!');
      if (onSuccessNavigateTo) {
          navigation.navigate(onSuccessNavigateTo);
      } else {
          navigation.goBack();
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Checkout</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.amount}>Total: ${amount.toFixed(2)}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button
          variant="primary"
          title="Pay Now"
          onPress={openPaymentSheet}
        />
      )}
    </View>
  );
};

const CheckoutScreen = (props) => {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <CheckoutForm {...props} />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 18, color: '#333', marginBottom: 10, textAlign: 'center' },
  amount: { fontSize: 24, fontWeight: 'bold', color: '#28a745', marginBottom: 40, textAlign: 'center' }
});

export default CheckoutScreen;

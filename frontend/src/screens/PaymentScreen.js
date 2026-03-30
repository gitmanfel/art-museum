import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

const PaymentScreen = ({ navigation, route }) => {
  const {
    provider,
    clientSecret,
    paymentIntentId,
    amountCents,
    lineItems,
    placedAt,
    status,
    fulfilled,
    entitlementsChanged,
    userRole,
  } = route.params || {};

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canUseStripeSheet = useMemo(
    () => provider === 'stripe' && Boolean(clientSecret) && Boolean(publishableKey),
    [provider, clientSecret]
  );

  const continueToStatus = () => {
    navigation.replace('CheckoutStatus', {
      paymentIntentId,
      provider,
      amountCents,
      initialLineItems: lineItems,
      initialPlacedAt: placedAt,
      initialStatus: status,
      initialFulfilled: fulfilled,
      initialEntitlementsChanged: entitlementsChanged,
      initialUserRole: userRole,
    });
  };

  const handlePresentPayment = async () => {
    if (!canUseStripeSheet) {
      continueToStatus();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'The Art Museum',
      });

      if (init.error) {
        setError(init.error.message || 'Could not initialize payment sheet.');
        setLoading(false);
        return;
      }

      const result = await presentPaymentSheet();
      if (result.error) {
        setError(result.error.message || 'Payment was not completed.');
      } else {
        continueToStatus();
      }
    } catch (e) {
      setError(e.message || 'Unexpected payment error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SECURE PAYMENT</Text>
      <Text style={styles.title}>Complete Checkout</Text>
      <Text style={styles.subtitle}>
        {canUseStripeSheet
          ? 'Use Stripe Payment Sheet to complete your order securely.'
          : 'Stripe keys are not configured in this environment. You can continue to the status screen.'}
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Provider</Text>
        <Text style={styles.summaryValue}>{String(provider || 'unknown').toUpperCase()}</Text>
        <Text style={styles.summaryLabel}>Amount</Text>
        <Text style={styles.summaryValue}>${((amountCents || 0) / 100).toFixed(2)}</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handlePresentPayment}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryButtonText}>{canUseStripeSheet ? 'Open Payment Sheet' : 'Continue'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={continueToStatus}>
        <Text style={styles.secondaryButtonText}>Review Checkout Status</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#888',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#faf8f4',
    padding: 20,
    marginBottom: 20,
  },
  summaryLabel: {
    color: '#777',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#111',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    color: '#ff4c4c',
    fontSize: 13,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#111',
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#ff4c4c',
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PaymentScreen;

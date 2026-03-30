import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getCheckoutStatus } from '../services/checkout';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CheckoutStatusScreen = ({ navigation, route }) => {
  const { paymentIntentId, provider, amountCents, initialStatus, initialFulfilled, initialEntitlementsChanged, initialUserRole } = route.params || {};
  const { refreshProfile } = useAuth();
  const { loadCart } = useCart();

  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(initialStatus || 'processing');
  const [fulfilled, setFulfilled] = useState(Boolean(initialFulfilled));
  const [entitlementsChanged, setEntitlementsChanged] = useState(Boolean(initialEntitlementsChanged));
  const [userRole, setUserRole] = useState(initialUserRole || null);
  const [error, setError] = useState('');

  const refreshStatus = async () => {
    if (!paymentIntentId) return;

    setChecking(true);
    setError('');
    try {
      const data = await getCheckoutStatus(paymentIntentId);
      setFulfilled(Boolean(data.fulfilled));
      setEntitlementsChanged(Boolean(data.entitlementsChanged));
      setUserRole(data.userRole || null);
      setStatus(data.fulfilled ? 'succeeded' : 'processing');

      if (data.fulfilled) {
        await Promise.all([loadCart(), refreshProfile()]);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Could not refresh checkout status.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    let intervalId;

    if (!fulfilled && paymentIntentId) {
      refreshStatus();
      intervalId = setInterval(() => {
        refreshStatus();
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fulfilled, paymentIntentId]);

  const amountLabel = Number.isFinite(amountCents)
    ? `$${(amountCents / 100).toFixed(2)}`
    : '$0.00';

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CHECKOUT STATUS</Text>
      <Text style={styles.title}>{fulfilled ? 'Payment Confirmed' : 'Payment Processing'}</Text>
      <Text style={styles.subtitle}>
        {fulfilled
          ? 'Your order has been fulfilled and your cart has been updated.'
          : 'We are waiting for payment confirmation from the provider.'}
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Provider</Text>
          <Text style={styles.value}>{String(provider || 'unknown').toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{amountLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, fulfilled ? styles.success : styles.pending]}>
            {fulfilled ? 'SUCCEEDED' : String(status || 'processing').toUpperCase()}
          </Text>
        </View>
        {entitlementsChanged ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>Membership Activated</Text>
            <Text style={styles.noticeText}>
              Your account is now {String(userRole || 'member').toUpperCase()} and member pricing is active.
            </Text>
          </View>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {checking ? <ActivityIndicator color="#ff4c4c" style={styles.loader} /> : null}

      {!fulfilled ? (
        <TouchableOpacity style={styles.primaryButton} onPress={refreshStatus} disabled={checking}>
          <Text style={styles.primaryButtonText}>Refresh Status</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.secondaryButton, !fulfilled && styles.secondaryButtonAlt]}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.secondaryButtonText}>{fulfilled ? 'Return to Museum' : 'Back to Museum'}</Text>
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
    fontSize: 12,
    letterSpacing: 2,
    color: '#888',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#faf8f4',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 14,
    color: '#111',
    fontWeight: '700',
  },
  success: {
    color: '#1a7f37',
  },
  pending: {
    color: '#c45500',
  },
  noticeBox: {
    borderTopWidth: 1,
    borderTopColor: '#e7dfd3',
    paddingTop: 14,
    marginTop: 4,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  errorText: {
    color: '#ff4c4c',
    fontSize: 13,
    marginBottom: 12,
  },
  loader: {
    marginBottom: 16,
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
  secondaryButtonAlt: {
    backgroundColor: '#d9d9d9',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CheckoutStatusScreen;

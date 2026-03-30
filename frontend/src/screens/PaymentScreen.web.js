import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const PaymentScreen = ({ navigation, route }) => {
  const {
    provider,
    paymentIntentId,
    amountCents,
    lineItems,
    placedAt,
    status,
    fulfilled,
    entitlementsChanged,
    userRole,
  } = route.params || {};

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

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SECURE PAYMENT</Text>
      <Text style={styles.title}>Continue Checkout</Text>
      <Text style={styles.subtitle}>
        Web checkout currently uses status verification flow directly.
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Provider</Text>
        <Text style={styles.summaryValue}>{String(provider || 'unknown').toUpperCase()}</Text>
        <Text style={styles.summaryLabel}>Amount</Text>
        <Text style={styles.summaryValue}>${((amountCents || 0) / 100).toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={continueToStatus}>
        <Text style={styles.primaryButtonText}>Continue</Text>
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
  primaryButton: {
    backgroundColor: '#111',
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PaymentScreen;

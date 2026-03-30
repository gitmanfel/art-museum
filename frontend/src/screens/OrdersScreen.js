import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { getMyOrders } from '../services/checkout';

const formatCurrency = (amountCents, currency = 'usd') => {
  const amount = Number(amountCents || 0) / 100;
  const normalized = String(currency || 'usd').toUpperCase();
  return `${normalized} ${amount.toFixed(2)}`;
};

const formatDate = (unixEpoch) => {
  if (!unixEpoch) return 'Unknown date';
  return new Date(Number(unixEpoch) * 1000).toLocaleString();
};

const OrderCard = ({ order }) => (
  <View style={styles.card}>
    <View style={styles.row}>
      <Text style={styles.label}>Order Ref</Text>
      <Text style={styles.reference}>{order.payment_intent_id}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Amount</Text>
      <Text style={styles.value}>{formatCurrency(order.amount_cents, order.currency)}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Provider</Text>
      <Text style={styles.value}>{String(order.provider || 'unknown').toUpperCase()}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Status</Text>
      <Text style={[styles.value, order.status === 'paid' ? styles.success : styles.pending]}>
        {String(order.status || 'processing').toUpperCase()}
      </Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Placed At</Text>
      <Text style={styles.value}>{formatDate(order.created_at)}</Text>
    </View>
  </View>
);

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getMyOrders();
      setOrders(result);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load your orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff4c4c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <Text style={styles.subtitle}>All your placed orders appear here.</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {orders.length === 0 ? (
        <View style={styles.centeredEmpty}>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Once you place an order, it will show up on this page.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable style={styles.refreshButton} onPress={loadOrders}>
        <Text style={styles.refreshButtonText}>Refresh Orders</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  centered: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredEmpty: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 14,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#faf8f4',
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 13,
    color: '#111',
    fontWeight: '700',
  },
  reference: {
    flex: 1,
    marginLeft: 10,
    textAlign: 'right',
    fontSize: 12,
    color: '#111',
    fontWeight: '700',
  },
  success: {
    color: '#1a7f37',
  },
  pending: {
    color: '#c45500',
  },
  emptyTitle: {
    fontSize: 20,
    color: '#111',
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    maxWidth: 300,
  },
  errorText: {
    color: '#ff4c4c',
    marginBottom: 10,
  },
  refreshButton: {
    marginTop: 8,
    backgroundColor: '#ff4c4c',
    paddingVertical: 14,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default OrdersScreen;

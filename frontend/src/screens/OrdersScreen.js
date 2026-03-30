import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
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

const OrderCard = ({ order, isCompact }) => (
  <View style={[styles.card, { padding: isCompact ? 12 : 14, marginBottom: isCompact ? 10 : 10 }]}>
    <View style={styles.row}>
      <Text style={[styles.label, { fontSize: isCompact ? 11 : 12 }]}>Order Ref</Text>
      <Text style={[styles.reference, { fontSize: isCompact ? 11 : 12 }]}>{order.payment_intent_id}</Text>
    </View>
    <View style={styles.row}>
      <Text style={[styles.label, { fontSize: isCompact ? 11 : 12 }]}>Amount</Text>
      <Text style={[styles.value, { fontSize: isCompact ? 12 : 13 }]}>{formatCurrency(order.amount_cents, order.currency)}</Text>
    </View>
    <View style={styles.row}>
      <Text style={[styles.label, { fontSize: isCompact ? 11 : 12 }]}>Provider</Text>
      <Text style={[styles.value, { fontSize: isCompact ? 12 : 13 }]}>{String(order.provider || 'unknown').toUpperCase()}</Text>
    </View>
    <View style={styles.row}>
      <Text style={[styles.label, { fontSize: isCompact ? 11 : 12 }]}>Status</Text>
      <Text style={[styles.value, order.status === 'paid' ? styles.success : styles.pending, { fontSize: isCompact ? 12 : 13 }]}>
        {String(order.status || 'processing').toUpperCase()}
      </Text>
    </View>
    <View style={styles.row}>
      <Text style={[styles.label, { fontSize: isCompact ? 11 : 12 }]}>Placed At</Text>
      <Text style={[styles.value, { fontSize: isCompact ? 11 : 12 }]}>{formatDate(order.created_at)}</Text>
    </View>
  </View>
);

const OrdersScreen = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
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
    <View style={[styles.container, { paddingHorizontal: isCompact ? 14 : 20 }]}>
      <Text style={[styles.title, { fontSize: isCompact ? 24 : isWide ? 34 : 28, marginTop: isCompact ? 14 : 18 }]}>My Orders</Text>
      <Text style={[styles.subtitle, { fontSize: isCompact ? 12 : 13, marginBottom: isCompact ? 12 : 14 }]}>All your placed orders appear here.</Text>

      {error ? <Text style={[styles.errorText, { fontSize: isCompact ? 12 : 13 }]}>{error}</Text> : null}

      {orders.length === 0 ? (
        <View style={styles.centeredEmpty}>
          <Text style={[styles.emptyTitle, { fontSize: isCompact ? 18 : 20 }]}>No orders yet</Text>
          <Text style={[styles.emptyText, { fontSize: isCompact ? 12 : 13 }]}>Once you place an order, it will show up on this page.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <OrderCard order={item} isCompact={isCompact} />}
          contentContainerStyle={[styles.list, isWide && { maxWidth: 800 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable 
        style={({ pressed }) => [styles.refreshButton, { opacity: pressed ? 0.85 : 1, marginBottom: isCompact ? 14 : 20 }]} 
        onPress={loadOrders}
        accessibilityRole="button"
        accessibilityLabel="Refresh orders"
        accessibilityHint="Reloads your order list"
      >
        <Text style={[styles.refreshButtonText, { fontSize: isCompact ? 14 : 15 }]}>Refresh Orders</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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

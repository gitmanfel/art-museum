import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAdminOverview } from '../services/admin';

const formatCurrency = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const AdminDashboardScreen = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Unable to load admin dashboard.');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const metrics = useMemo(() => {
    if (!overview) return [];
    return [
      { label: 'Total Users', value: String(overview.users?.totalUsers || 0) },
      { label: 'Members', value: String(overview.users?.members || 0) },
      { label: 'Orders', value: String(overview.orders?.totalOrders || 0) },
      { label: 'Revenue', value: formatCurrency(overview.orders?.grossRevenueCents) },
    ];
  }, [overview]);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#ff4c4c" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOverview(true)} />}
    >
      <Text style={styles.heading}>Admin Dashboard</Text>

      <View style={styles.statsGrid}>
        {metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
        {(overview?.lowStockProducts || []).length === 0 ? (
          <Text style={styles.emptyText}>No low stock products.</Text>
        ) : (
          overview.lowStockProducts.map((product) => (
            <View key={product.id} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{product.name}</Text>
              <Text style={styles.rowMeta}>Stock: {product.stock_quantity}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {(overview?.recentOrders || []).length === 0 ? (
          <Text style={styles.emptyText}>No recent orders yet.</Text>
        ) : (
          overview.recentOrders.map((order) => (
            <View key={order.id} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{order.payment_intent_id}</Text>
              <Text style={styles.rowMeta}>{formatCurrency(order.amount_cents)} • {order.provider}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#c13030',
    textAlign: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  section: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#ececec',
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  emptyText: {
    color: '#777',
    fontSize: 13,
  },
  rowItem: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  rowTitle: {
    color: '#111',
    fontWeight: '600',
    fontSize: 13,
  },
  rowMeta: {
    color: '#666',
    marginTop: 4,
    fontSize: 12,
  },
});

export default AdminDashboardScreen;

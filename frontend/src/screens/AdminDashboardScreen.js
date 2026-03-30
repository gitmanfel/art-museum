import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAdminAuditLogs, getAdminOrders, getAdminOverview, getAdminUsers } from '../services/admin';

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
  const [auditLogs, setAuditLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  const loadOverview = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');
    try {
      const [data, audit, ordersResult, usersResult] = await Promise.all([
        getAdminOverview(),
        getAdminAuditLogs({ page: 1, pageSize: 8 }),
        getAdminOrders({ page: ordersPage, pageSize: 8, search }),
        getAdminUsers({ page: usersPage, pageSize: 8, search }),
      ]);
      setOverview(data);
      setAuditLogs(audit.auditLogs || []);
      setOrders(ordersResult.orders || []);
      setUsers(usersResult.users || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Unable to load admin dashboard.');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [ordersPage, usersPage, search]);

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

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search users or orders"
          placeholderTextColor="#9b9b9b"
        />
      </View>

      <View style={styles.statsGrid}>
        {metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
        {overview?.runtimeMetrics ? (
          <StatCard
            label="Checkout Failure Rate"
            value={`${Math.round((overview.runtimeMetrics.checkoutFailureRate || 0) * 100)}%`}
          />
        ) : null}
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
        {orders.length === 0 ? (
          <Text style={styles.emptyText}>No recent orders yet.</Text>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{order.payment_intent_id}</Text>
              <Text style={styles.rowMeta}>{formatCurrency(order.amount_cents)} • {order.provider}</Text>
            </View>
          ))
        )}
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={styles.pageBtn}
            onPress={() => setOrdersPage((p) => Math.max(1, p - 1))}
          >
            <Text style={styles.pageBtnText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.rowMeta}>Page {ordersPage}</Text>
          <TouchableOpacity
            style={styles.pageBtn}
            onPress={() => setOrdersPage((p) => p + 1)}
          >
            <Text style={styles.pageBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users</Text>
        {users.length === 0 ? (
          <Text style={styles.emptyText}>No users found.</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{user.email}</Text>
              <Text style={styles.rowMeta}>Role: {user.role}</Text>
            </View>
          ))
        )}
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={styles.pageBtn}
            onPress={() => setUsersPage((p) => Math.max(1, p - 1))}
          >
            <Text style={styles.pageBtnText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.rowMeta}>Page {usersPage}</Text>
          <TouchableOpacity
            style={styles.pageBtn}
            onPress={() => setUsersPage((p) => p + 1)}
          >
            <Text style={styles.pageBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Audit Logs</Text>
        {auditLogs.length === 0 ? (
          <Text style={styles.emptyText}>No audit events yet.</Text>
        ) : (
          auditLogs.map((entry) => (
            <View key={entry.id} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{entry.action}</Text>
              <Text style={styles.rowMeta}>{entry.entity_type} • {entry.entity_id}</Text>
              <Text style={styles.rowMeta}>{entry.actor_email || entry.actor_user_id}</Text>
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
  searchRow: {
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e3e3e3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
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
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  pageBtn: {
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pageBtnText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
});

export default AdminDashboardScreen;

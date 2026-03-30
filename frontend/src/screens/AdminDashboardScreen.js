import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  getAdminAuditLogs,
  getAdminContactMessages,
  getAdminNewsletterSubscribers,
  getAdminOrders,
  getAdminOverview,
  getAdminUsers,
  replyToAdminContactMessage,
} from '../services/admin';

const formatCurrency = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const StatCard = ({ label, value, isCompact }) => (
  <View style={[styles.statCard, isCompact && styles.statCardCompact]}>
    <Text style={[styles.statLabel, isCompact && { fontSize: 11 }]}>{label}</Text>
    <Text style={[styles.statValue, isCompact && { fontSize: 19 }]}>{value}</Text>
  </View>
);

const AdminDashboardScreen = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [search, setSearch] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  const loadOverview = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');
    try {
      const [data, audit, ordersResult, usersResult, messagesResult, subscribersResult] = await Promise.all([
        getAdminOverview(),
        getAdminAuditLogs({ page: 1, pageSize: 8, search }),
        getAdminOrders({ page: ordersPage, pageSize: 8, search }),
        getAdminUsers({ page: usersPage, pageSize: 8, search }),
        getAdminContactMessages({ page: 1, pageSize: 6, search }),
        getAdminNewsletterSubscribers({ page: 1, pageSize: 6, search }),
      ]);

      setOverview(data);
      setAuditLogs(audit.auditLogs || []);
      setOrders(ordersResult.orders || []);
      setUsers(usersResult.users || []);
      setMessages(messagesResult.messages || []);
      setSubscribers(subscribersResult.subscribers || []);
    } catch (e) {
      if (e.response?.status === 403) {
        setError('Admin access required. Log in with an admin account to view dashboard data.');
      } else {
        setError(e.response?.data?.error || 'Unable to load admin dashboard.');
      }
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const openMessageModal = (message) => {
    setSelectedMessage(message);
    setReplySubject(`Re: ${message.subject}`);
    setReplyBody('');
    setModalError('');
  };

  const closeMessageModal = () => {
    setSelectedMessage(null);
    setReplySubject('');
    setReplyBody('');
    setModalError('');
  };

  const sendReply = async () => {
    if (!selectedMessage) return;
    if (!replySubject.trim() || !replyBody.trim()) {
      setModalError('Reply subject and body are required.');
      return;
    }

    setSendingReply(true);
    setModalError('');
    try {
      const replyResult = await replyToAdminContactMessage({
        id: selectedMessage.id,
        subject: replySubject.trim(),
        body: replyBody.trim(),
      });
      setMessages((prev) => prev.map((msg) => (
        msg.id === selectedMessage.id
          ? { ...msg, replied_at: replyResult?.message?.replied_at, replied_by: replyResult?.message?.replied_by }
          : msg
      )));
      closeMessageModal();
    } catch (e) {
      setModalError(e.response?.data?.error || 'Could not send reply email.');
    } finally {
      setSendingReply(false);
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
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOverview(true)} />}
    >
      <View style={[styles.pageContainer, { paddingHorizontal: isCompact ? 14 : 16 }, isWide && styles.pageContainerWide]}>
      <Text style={[styles.heading, { fontSize: isCompact ? 22 : isWide ? 32 : 26 }]}>Admin Dashboard</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, { fontSize: isCompact ? 13 : 14 }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search users, orders, messages"
          placeholderTextColor="#9b9b9b"
          accessibilityLabel="Search input"
          accessibilityHint="Search for users, orders, or contact messages"
        />
      </View>

      <View style={[styles.statsGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
        {metrics.map((metric) => (
          <View key={metric.label} style={{ width: isCompact ? '100%' : isWide ? '25%' : '50%', paddingRight: isWide ? 16 : isCompact ? 0 : 8, marginBottom: isCompact ? 12 : isWide ? 16 : 12 }}>
            <StatCard label={metric.label} value={metric.value} isCompact={isCompact} />
          </View>
        ))}
        {overview?.runtimeMetrics ? (
          <View style={{ width: isCompact ? '100%' : isWide ? '25%' : '50%', paddingRight: isWide ? 16 : isCompact ? 0 : 8, marginBottom: isCompact ? 12 : isWide ? 16 : 12 }}>
            <StatCard
              label="Checkout Failure Rate"
              value={`${Math.round((overview.runtimeMetrics.checkoutFailureRate || 0) * 100)}%`}
              isCompact={isCompact}
            />
          </View>
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
              <Text style={styles.rowMeta}>{formatCurrency(order.amount_cents)} - {order.provider}</Text>
            </View>
          ))
        )}
        <View style={styles.paginationRow}>
          <TouchableOpacity style={styles.pageBtn} onPress={() => setOrdersPage((p) => Math.max(1, p - 1))}>
            <Text style={styles.pageBtnText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.rowMeta}>Page {ordersPage}</Text>
          <TouchableOpacity style={styles.pageBtn} onPress={() => setOrdersPage((p) => p + 1)}>
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
          <TouchableOpacity style={styles.pageBtn} onPress={() => setUsersPage((p) => Math.max(1, p - 1))}>
            <Text style={styles.pageBtnText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.rowMeta}>Page {usersPage}</Text>
          <TouchableOpacity style={styles.pageBtn} onPress={() => setUsersPage((p) => p + 1)}>
            <Text style={styles.pageBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Messages</Text>
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>No contact messages yet.</Text>
        ) : (
          messages.map((msg) => (
            <TouchableOpacity key={msg.id} style={styles.rowItem} onPress={() => openMessageModal(msg)}>
              <View style={styles.messageHeaderRow}>
                <Text style={styles.rowTitle}>{msg.subject}</Text>
                <Text style={[styles.messageBadge, msg.replied_at ? styles.messageBadgeReplied : styles.messageBadgePending]}>
                  {msg.replied_at ? 'REPLIED' : 'PENDING'}
                </Text>
              </View>
              <Text style={styles.rowMeta}>{msg.name} - {msg.email}</Text>
              <Text style={styles.rowMeta} numberOfLines={1}>{msg.message}</Text>
              {msg.replied_at ? (
                <Text style={styles.rowMeta}>Replied: {new Date(msg.replied_at * 1000).toLocaleString()}</Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mailing List Subscribers</Text>
        {subscribers.length === 0 ? (
          <Text style={styles.emptyText}>No subscribers yet.</Text>
        ) : (
          subscribers.map((sub) => (
            <View key={sub.id} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{sub.full_name || 'Unnamed subscriber'}</Text>
              <Text style={styles.rowMeta}>{sub.email}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Audit Logs</Text>
        {auditLogs.length === 0 ? (
          <Text style={styles.emptyText}>No audit events yet.</Text>
        ) : (
          auditLogs.map((entry) => (
            <View key={entry.id} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{entry.action}</Text>
              <Text style={styles.rowMeta}>{entry.entity_type} - {entry.entity_id}</Text>
              <Text style={styles.rowMeta}>{entry.actor_email || entry.actor_user_id}</Text>
            </View>
          ))
        )}
      </View>
      </View>

      <Modal
        visible={Boolean(selectedMessage)}
        transparent
        animationType="fade"
        onRequestClose={closeMessageModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Message Details</Text>
            {selectedMessage ? (
              <>
                <Text style={styles.rowMeta}>From: {selectedMessage.name} ({selectedMessage.email})</Text>
                <Text style={styles.rowMeta}>Subject: {selectedMessage.subject}</Text>
                <Text style={styles.rowMeta}>
                  Status: {selectedMessage.replied_at ? 'Replied' : 'Pending'}
                </Text>
                {selectedMessage.replied_at ? (
                  <Text style={styles.rowMeta}>Replied at: {new Date(selectedMessage.replied_at * 1000).toLocaleString()}</Text>
                ) : null}
                <Text style={styles.modalMessage}>{selectedMessage.message}</Text>
              </>
            ) : null}

            <TextInput
              style={styles.searchInput}
              placeholder="Reply subject"
              placeholderTextColor="#9b9b9b"
              value={replySubject}
              onChangeText={setReplySubject}
            />
            <TextInput
              style={[styles.searchInput, styles.replyBodyInput]}
              placeholder="Reply message"
              placeholderTextColor="#9b9b9b"
              multiline
              value={replyBody}
              onChangeText={setReplyBody}
            />
            {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.pageBtn} onPress={closeMessageModal}>
                <Text style={styles.pageBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendReplyBtn} onPress={sendReply} disabled={sendingReply}>
                <Text style={styles.sendReplyBtnText}>{sendingReply ? 'Sending...' : 'Send Reply'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    width: '100%',
    alignItems: 'stretch',
  },
  pageContainer: {
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 16,
  },
  pageContainerWide: {
    maxWidth: 1200,
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
    marginBottom: 14,
  },
  statCard: {
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  statCardCompact: {
    padding: 10,
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
  messageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  messageBadgeReplied: {
    color: '#0d652d',
    backgroundColor: '#d9f2e1',
  },
  messageBadgePending: {
    color: '#8a4b00',
    backgroundColor: '#ffe8cc',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  modalErrorText: {
    color: '#c13030',
    marginTop: 8,
    fontSize: 12,
  },
  replyBodyInput: {
    minHeight: 92,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sendReplyBtn: {
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendReplyBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default AdminDashboardScreen;

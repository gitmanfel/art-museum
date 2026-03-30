import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { createCheckoutIntent } from '../services/checkout';

const CartScreen = ({ navigation }) => {
  const { items, total, loading, error, loadCart, removeItem, clearCart } = useCart();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCart);
    return unsubscribe;
  }, [navigation, loadCart]);

  const handleRemove = (id, name) => {
    Alert.alert('Remove item', `Remove "${name}" from your cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeItem(id) },
    ]);
  };

  const handleClear = () => {
    Alert.alert('Clear cart', 'Remove all items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: clearCart },
    ]);
  };

  const handleCheckout = async () => {
    try {
      const intent = await createCheckoutIntent();
      Alert.alert(
        'Checkout Ready',
        `Provider: ${intent.provider}\nAmount: $${(intent.amountCents / 100).toFixed(2)}\nStatus: ${intent.status}`
      );
    } catch (e) {
      const msg = e.response?.data?.error || 'Could not start checkout.';
      Alert.alert('Checkout Error', msg);
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff4c4c" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Shop')} style={styles.shopBtn}>
          <Text style={styles.shopBtnText}>Browse the Shop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.itemName}>{item.metadata?.name || item.item_id}</Text>
        <Text style={styles.itemMeta}>
          {item.item_type} · qty {item.quantity} · ${(item.unit_price * item.quantity).toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleRemove(item.id, item.metadata?.name || item.item_id)}>
        <Text style={styles.removeBtn}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyText:      { fontSize: 18, color: '#aaa', marginBottom: 24 },
  shopBtn:        { backgroundColor: '#ff4c4c', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 4 },
  shopBtnText:    { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  list:           { padding: 20 },
  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowInfo:        { flex: 1 },
  itemName:       { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  itemMeta:       { fontSize: 12, color: '#888' },
  removeBtn:      { fontSize: 18, color: '#ccc', paddingLeft: 16 },
  separator:      { height: 1, backgroundColor: '#eee', marginVertical: 14 },
  errorText:      { color: '#ff4c4c', textAlign: 'center', padding: 12 },
  footer:         { borderTopWidth: 1, borderColor: '#eee', padding: 20 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel:     { fontSize: 18, fontWeight: 'bold', color: '#000' },
  totalValue:     { fontSize: 18, fontWeight: 'bold', color: '#ff4c4c' },
  checkoutBtn:    { backgroundColor: '#ff4c4c', paddingVertical: 15, alignItems: 'center', borderRadius: 4, marginBottom: 12 },
  checkoutBtnText:{ color: '#fff', fontWeight: 'bold', fontSize: 16 },
  clearBtn:       { alignItems: 'center', paddingVertical: 8 },
  clearBtnText:   { color: '#ccc', fontSize: 13 },
});

export default CartScreen;

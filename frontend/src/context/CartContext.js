import React, { createContext, useContext, useState, useCallback } from 'react';
import { fetchCart, addToCart, removeFromCart, clearCartApi } from '../services/cart';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const syncState = (data) => {
    setItems(data.items || []);
    setTotal(data.total  || 0);
  };

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCart();
      syncState(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async ({ itemType, itemId, quantity = 1 }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await addToCart({ itemType, itemId, quantity });
      syncState(data);
      return { success: true };
    } catch (e) {
      const msg = e.response?.data?.error || 'Could not add item to cart.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (cartItemId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await removeFromCart(cartItemId);
      syncState(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not remove item.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clearCartApi();
      syncState(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not clear cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, total, itemCount, loading, error, loadCart, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

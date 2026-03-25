import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://10.0.2.2:5000/api';

const MyBookingsScreen = ({ route }) => {
  const { token } = route.params;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect to refresh bookings whenever screen is navigated to
  useFocusEffect(
    useCallback(() => {
      fetchMyBookings();
    }, [])
  );

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tickets/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        Alert.alert('Error', 'Failed to fetch your bookings');
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.ticket_name}</Text>
      <Text style={styles.date}>Visit Date: {new Date(item.visit_date).toLocaleDateString()}</Text>
      <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
      <Text style={styles.price}>Total Paid: ${parseFloat(item.total_price).toFixed(2)}</Text>
      <Text style={styles.bookingId}>Booking Reference: #{item.id}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You have no upcoming visits.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: 'gray' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  quantity: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 10,
  },
  bookingId: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'right',
  },
});

export default MyBookingsScreen;

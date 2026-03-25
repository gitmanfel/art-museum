import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert, TouchableOpacity, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = 'http://10.0.2.2:5000/api';

const TicketsScreen = ({ navigation, route }) => {
  const { token } = route.params;
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    fetchTicketTypes();
  }, []);

  const fetchTicketTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets/types`);
      if (response.ok) {
        const data = await response.json();
        setTicketTypes(data);

        // Initialize quantities to 0
        const initialQuantities = {};
        data.forEach(t => { initialQuantities[t.id] = 0; });
        setQuantities(initialQuantities);
      }
    } catch (error) {
      console.error('Failed to fetch ticket types:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id, delta) => {
    setQuantities(prev => {
      const newQty = prev[id] + delta;
      if (newQty < 0) return prev;
      return { ...prev, [id]: newQty };
    });
  };

  const calculateTotal = () => {
    return ticketTypes.reduce((sum, ticket) => {
      return sum + (parseFloat(ticket.price) * (quantities[ticket.id] || 0));
    }, 0);
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleBookTickets = async () => {
    const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
    if (totalTickets === 0) {
      Alert.alert('Error', 'Please select at least one ticket.');
      return;
    }

    // Format for backend
    const ticketsPayload = ticketTypes.map(t => ({
      ticket_type_id: t.id,
      quantity: quantities[t.id]
    })).filter(t => t.quantity > 0);

    const formattedDate = date.toISOString().split('T')[0];

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tickets/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: formattedDate, tickets: ticketsPayload })
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', `Tickets booked! Total charged: $${data.grandTotal.toFixed(2)}`);
        // Reset counters
        const resetQuantities = {};
        ticketTypes.forEach(t => { resetQuantities[t.id] = 0; });
        setQuantities(resetQuantities);
        navigation.navigate('MyBookings');
      } else {
        Alert.alert('Booking Failed', data.message || 'Error occurred');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Buy Tickets</Text>

      <View style={styles.dateContainer}>
        <Text style={styles.label}>Select Visit Date:</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()} // Can't book past dates
          />
        )}
      </View>

      <Text style={styles.label}>Select Ticket Types:</Text>
      {ticketTypes.map(ticket => (
        <View key={ticket.id} style={styles.ticketRow}>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketName}>{ticket.name}</Text>
            <Text style={styles.ticketDesc}>{ticket.description}</Text>
            <Text style={styles.ticketPrice}>${parseFloat(ticket.price).toFixed(2)}</Text>
          </View>
          <View style={styles.counter}>
            <TouchableOpacity onPress={() => updateQuantity(ticket.id, -1)} style={styles.counterBtn}>
              <Text style={styles.counterBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantities[ticket.id]}</Text>
            <TouchableOpacity onPress={() => updateQuantity(ticket.id, 1)} style={styles.counterBtn}>
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
        </View>
        <Button title="Book Now" onPress={handleBookTickets} color="#007bff" />
        <View style={{ marginTop: 10 }}>
          <Button title="View My Bookings" onPress={() => navigation.navigate('MyBookings')} color="#6c757d" />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  dateContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  dateInput: { backgroundColor: '#fff', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#ccc' },
  ticketRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  ticketInfo: { flex: 1 },
  ticketName: { fontSize: 18, fontWeight: 'bold' },
  ticketDesc: { fontSize: 14, color: 'gray', marginBottom: 5 },
  ticketPrice: { fontSize: 16, color: '#28a745', fontWeight: 'bold' },
  counter: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: { backgroundColor: '#e0e0e0', width: 35, height: 35, borderRadius: 17.5, alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { fontSize: 20, fontWeight: 'bold' },
  qtyText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15 },
  footer: { marginTop: 20, padding: 20, backgroundColor: '#fff', borderRadius: 8, elevation: 3 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 20, fontWeight: 'bold' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#28a745' },
});

export default TicketsScreen;

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useCart } from '../context/CartContext';
import { getTicketTypes } from '../services/catalogue';

const TicketsScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [ticketTypes, setTicketTypes] = useState([]);
  const [counts, setCounts] = useState({});
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [catalogueError, setCatalogueError] = useState('');
  const { addItem, loading } = useCart();

  useEffect(() => {
    let isMounted = true;

    const loadTickets = async () => {
      setLoadingCatalogue(true);
      setCatalogueError('');
      try {
        const data = await getTicketTypes();
        if (!isMounted) return;
        setTicketTypes(data);
        setCounts(
          data.reduce((acc, ticket) => {
            acc[ticket.id] = ticket.id === 'ticket-adults' ? 2 : 0;
            return acc;
          }, {})
        );
      } catch (e) {
        if (!isMounted) return;
        setCatalogueError('Could not load ticket catalogue.');
      } finally {
        if (isMounted) setLoadingCatalogue(false);
      }
    };

    loadTickets();
    return () => {
      isMounted = false;
    };
  }, []);

  const increment = (type) => {
    setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const decrement = (type) => {
    setCounts((prev) => ({ ...prev, [type]: prev[type] > 0 ? prev[type] - 1 : 0 }));
  };

  const calculateTotal = () => {
    return ticketTypes.reduce((sum, ticket) => {
      const qty = counts[ticket.id] || 0;
      return sum + qty * ticket.price;
    }, 0);
  };

  const renderCounterRow = (ticket) => (
    <View key={ticket.id} style={styles.counterRow}>
      <View>
        <Text style={styles.counterTitle}>{ticket.name}</Text>
        {ticket.description ? <Text style={styles.counterSubtitle}>{ticket.description}</Text> : null}
      </View>
      <View style={styles.quantitySelector}>
        <TouchableOpacity onPress={() => decrement(ticket.id)} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{counts[ticket.id] || 0}</Text>
        <TouchableOpacity onPress={() => increment(ticket.id)} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loadingCatalogue) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4c4c" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Skip the Line.{'\n'}Purchase Tickets.</Text>
        <Text style={styles.subtitleText}>All exhibitions, audio tours, and films{'\n'}included in the price of admission.</Text>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelectorContainer}>
        {['Today', 'Tomorrow', 'Other'].map((day) => (
          <TouchableOpacity 
            key={day} 
            onPress={() => setSelectedDate(day)}
            style={styles.dateOption}
          >
            <Text style={[
              styles.dateText, 
              selectedDate === day && styles.dateTextActive
            ]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateInfoBox}>
        <Text style={styles.dateInfoPrimary}>March 22, 2016</Text>
        <Text style={styles.dateInfoSecondary}>Open 10:30am-5:30pm</Text>
      </View>

      {/* Counters */}
      <View style={styles.countersContainer}>
        {catalogueError ? <Text style={styles.errorText}>{catalogueError}</Text> : null}
        {ticketTypes.map(renderCounterRow)}
      </View>

      {/* Total Section */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${calculateTotal()}</Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={styles.paymentButton}
        disabled={loading || calculateTotal() === 0}
        onPress={async () => {
          const entries = Object.entries(counts).filter(([, qty]) => qty > 0);
          if (entries.length === 0) {
            Alert.alert('No tickets selected', 'Please select at least one ticket.');
            return;
          }
          const results = await Promise.all(
            entries.map(([ticketId, qty]) =>
              addItem({ itemType: 'ticket', itemId: ticketId, quantity: qty })
            )
          );
          const anyFailed = results.some(r => !r.success);
          if (anyFailed) {
            Alert.alert('Error', 'Could not add tickets. Please try again.');
          } else {
            navigation.getParent().navigate('Cart');
          }
        }}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.paymentButtonText}>Continue to Payment</Text>
        }
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#ff4c4c',
    marginBottom: 16,
    fontSize: 13,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 14,
    color: '#ff4c4c',
    lineHeight: 20,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  dateOption: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#ccc',
  },
  dateTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  dateInfoBox: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  dateInfoPrimary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  dateInfoSecondary: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  countersContainer: {
    marginBottom: 20,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  counterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  counterSubtitle: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
  },
  qtyBtn: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#ccc',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 10,
    minWidth: 30,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#ff4c4c',
    paddingTop: 15,
    marginBottom: 30,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4c4c',
  },
  paymentButton: {
    backgroundColor: '#ff4c4c',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 4,
    marginBottom: 40, // extra padding for bottom scrolling
  },
  paymentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default TicketsScreen;

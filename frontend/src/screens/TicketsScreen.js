import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useCart } from '../context/CartContext';
import { getTicketTypes } from '../services/catalogue';

const formatTicketPrice = (price) => `$${Number(price).toFixed(2)}`;

const TicketsScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;

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
    <View key={ticket.id} style={[styles.counterRow, isCompact && styles.counterRowCompact]}>
      <View style={styles.counterInfo}>
        <Text style={styles.counterPrice}>{formatTicketPrice(ticket.price)}</Text>
        <Text style={styles.counterTitle}>{ticket.name}</Text>
        {ticket.description ? <Text style={styles.counterSubtitle}>{ticket.description}</Text> : null}
      </View>
      <View style={styles.quantitySelector}>
        <TouchableOpacity
          onPress={() => decrement(ticket.id)}
          style={styles.qtyBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${ticket.name} ticket quantity`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{counts[ticket.id] || 0}</Text>
        <TouchableOpacity
          onPress={() => increment(ticket.id)}
          style={styles.qtyBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${ticket.name} ticket quantity`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
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
    <ScrollView style={[styles.container, isCompact && styles.containerCompact, isWide && styles.containerWide]}>
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <Text style={[styles.titleText, isCompact && styles.titleTextCompact]}>Skip the Line.{'\n'}Purchase Tickets.</Text>
        <Text style={styles.subtitleText}>All exhibitions, audio tours, and films{'\n'}included in the price of admission.</Text>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelectorContainer}>
        {['Today', 'Tomorrow', 'Other'].map((day) => (
          <TouchableOpacity 
            key={day} 
            onPress={() => setSelectedDate(day)}
            style={styles.dateOption}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Select visit date ${day}`}
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

      <View style={[styles.dateInfoBox, isCompact && styles.dateInfoBoxCompact]}>
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
        <Text style={styles.totalValue}>{formatTicketPrice(calculateTotal())}</Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={[styles.paymentButton, isCompact && styles.paymentButtonCompact]}
        disabled={loading || calculateTotal() === 0}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Continue to payment"
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
  containerCompact: {
    padding: 14,
  },
  containerWide: {
    maxWidth: 880,
    width: '100%',
    alignSelf: 'center',
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
    marginBottom: 24,
  },
  headerCompact: {
    marginTop: 10,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 34,
    marginBottom: 10,
  },
  titleTextCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitleText: {
    fontSize: 14,
    color: '#ff4c4c',
    lineHeight: 20,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eadfce',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  dateOption: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#9d8b78',
    fontWeight: '600',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  dateTextActive: {
    color: '#1d1a17',
    fontWeight: 'bold',
    backgroundColor: '#f4e6d8',
  },
  dateInfoBox: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 14,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee2d4',
    backgroundColor: '#fdf8f2',
  },
  dateInfoBoxCompact: {
    marginTop: 12,
    marginBottom: 12,
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
    alignItems: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ede0d2',
    backgroundColor: '#fffaf5',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  counterRowCompact: {
    marginBottom: 10,
  },
  counterInfo: {
    flex: 1,
    paddingRight: 10,
  },
  counterPrice: {
    color: '#98521d',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },
  counterTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#17120f',
  },
  counterSubtitle: {
    fontSize: 12,
    color: '#6c6259',
    marginTop: 4,
    lineHeight: 17,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#decdbd',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  qtyBtn: {
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#85522f',
    fontWeight: '700',
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
    borderWidth: 1,
    borderColor: '#f0d6bf',
    backgroundColor: '#fff5ea',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
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
    borderRadius: 12,
    marginBottom: 40, // extra padding for bottom scrolling
  },
  paymentButtonCompact: {
    marginBottom: 24,
  },
  paymentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default TicketsScreen;

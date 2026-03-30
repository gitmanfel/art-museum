import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const PRICING = {
  adults: 8,
  seniors: 5,
  students: 5,
};

const TicketsScreen = () => {
  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [counts, setCounts] = useState({
    adults: 2,
    seniors: 0,
    students: 0,
  });

  const increment = (type) => {
    setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const decrement = (type) => {
    setCounts((prev) => ({ ...prev, [type]: prev[type] > 0 ? prev[type] - 1 : 0 }));
  };

  const calculateTotal = () => {
    return (
      counts.adults * PRICING.adults +
      counts.seniors * PRICING.seniors +
      counts.students * PRICING.students
    );
  };

  const renderCounterRow = (title, subtitle, type) => (
    <View style={styles.counterRow}>
      <View>
        <Text style={styles.counterTitle}>{title}</Text>
        {subtitle ? <Text style={styles.counterSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.quantitySelector}>
        <TouchableOpacity onPress={() => decrement(type)} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{counts[type]}</Text>
        <TouchableOpacity onPress={() => increment(type)} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        {renderCounterRow('Adults', '', 'adults')}
        {renderCounterRow('Seniors', '65+ with ID', 'seniors')}
        {renderCounterRow('Students', 'with ID', 'students')}
      </View>

      {/* Total Section */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${calculateTotal()}</Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={styles.paymentButton}
        onPress={() => console.log(`Proceeding to payment for $${calculateTotal()}`)}
      >
        <Text style={styles.paymentButtonText}>Continue to Payment</Text>
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

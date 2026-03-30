import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const MEMBERSHIP_TIERS = [
  { id: '1', name: 'Individual', price: '$75', description: '$60 tax deductible' },
  { id: '2', name: 'Dual', price: '$125', description: '$60 tax deductible' },
  { id: '3', name: 'Supporter', price: '$300', description: '$60 tax deductible' },
];

const MembershipScreen = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Image Section */}
      <View style={styles.heroContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} // Still life placeholder
          style={styles.heroImage} 
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTextPrimary}>Your Museum.</Text>
          <Text style={styles.heroTextSecondary}>Your Bounty of Experience.</Text>
        </View>
      </View>

      {/* Tiers Section */}
      <View style={styles.contentContainer}>
        <Text style={styles.instructionsText}>
          Choose the membership that's the best fit for you. {'\n'}Click on a level to view the full description of benefits.
        </Text>

        <View style={styles.tiersList}>
          {MEMBERSHIP_TIERS.map((tier) => (
            <TouchableOpacity key={tier.id} style={styles.tierRow}>
              <View>
                <Text style={styles.tierTitle}>{tier.name}—{tier.price}</Text>
                <Text style={styles.tierDescription}>{tier.description}</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => console.log('Proceeding to join today flow')}
        >
          <Text style={styles.joinButtonText}>Join Today</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroContainer: {
    position: 'relative',
    height: 350,
  },
  heroImage: {
    width: width,
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  heroTextPrimary: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  heroTextSecondary: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  contentContainer: {
    padding: 20,
  },
  instructionsText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 30,
  },
  tiersList: {
    marginBottom: 40,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  tierDescription: {
    fontSize: 12,
    color: '#aaa',
  },
  chevronIcon: {
    fontSize: 24,
    color: '#ccc',
    paddingRight: 10,
  },
  joinButton: {
    backgroundColor: '#ff4c4c',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 4,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default MembershipScreen;

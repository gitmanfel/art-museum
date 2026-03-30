import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useCart } from '../context/CartContext';
import { getMembershipTiers } from '../services/catalogue';

const MembershipScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [catalogueError, setCatalogueError] = useState('');
  const { addItem, loading } = useCart();

  useEffect(() => {
    let isMounted = true;

    const loadTiers = async () => {
      setLoadingCatalogue(true);
      setCatalogueError('');
      try {
        const data = await getMembershipTiers();
        if (!isMounted) return;
        setTiers(data);
      } catch (e) {
        if (!isMounted) return;
        setCatalogueError('Could not load membership tiers.');
      } finally {
        if (isMounted) setLoadingCatalogue(false);
      }
    };

    loadTiers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleJoin = async () => {
    if (!selectedTier) {
      Alert.alert('Select a tier', 'Please choose a membership level first.');
      return;
    }
    const result = await addItem({ itemType: 'membership', itemId: selectedTier, quantity: 1 });
    if (result.success) {
      navigation.getParent().navigate('Cart');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Image Section */}
      <View style={[styles.heroContainer, { height: isCompact ? 280 : isWide ? 380 : 350 }]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
          style={styles.heroImage} 
        />
        <View style={styles.heroOverlay}>
          <Text style={[styles.heroTextPrimary, { fontSize: isCompact ? 24 : isWide ? 32 : 28 }]}>Your Museum.</Text>
          <Text style={[styles.heroTextSecondary, { fontSize: isCompact ? 20 : isWide ? 28 : 24 }]}>Your Bounty of Experience.</Text>
        </View>
      </View>

      {/* Tiers Section */}
      <View style={[styles.contentContainer, { paddingHorizontal: isCompact ? 14 : 20 }]}>
        <Text style={[styles.instructionsText, { fontSize: isCompact ? 12 : 13, marginBottom: isCompact ? 24 : 30 }]}>
          Choose the membership that's the best fit for you. {'\n'}Click on a level to view the full description of benefits.
        </Text>

        <View style={styles.tiersList}>
          {loadingCatalogue ? (
            <View style={styles.catalogueLoadingRow}>
              <ActivityIndicator color="#ff4c4c" />
            </View>
          ) : null}

          {catalogueError ? <Text style={styles.errorText}>{catalogueError}</Text> : null}

          {tiers.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              style={[styles.tierRow, selectedTier === tier.id && styles.tierRowSelected, { paddingVertical: isCompact ? 16 : 20 }]}
              onPress={() => setSelectedTier(tier.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`${tier.name} membership at ${tier.price} dollars`}
              accessibilityHint="Select this membership tier"
            >
              <View>
                <Text style={[styles.tierTitle, { fontSize: isCompact ? 16 : 18 }]}>{tier.name} - ${Number(tier.price).toFixed(0)}</Text>
                <Text style={[styles.tierDescription, { fontSize: isCompact ? 11 : 12 }]}>${Number(tier.tax_deductible || 0).toFixed(0)} tax deductible</Text>
              </View>
              <Text style={[styles.chevronIcon, { fontSize: isCompact ? 20 : 24 }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.joinButton, { paddingVertical: isCompact ? 12 : 15, marginBottom: isCompact ? 16 : 20 }]}
          onPress={handleJoin}
          disabled={loading || loadingCatalogue || tiers.length === 0}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Join membership"
          accessibilityHint="Adds selected membership to your cart"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.joinButtonText, { fontSize: isCompact ? 14 : 15 }]}>Join Today</Text>
          }
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
  },
  heroImage: {
    width: '100%',
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
  catalogueLoadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4c4c',
    fontSize: 13,
    marginBottom: 8,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tierRowSelected: {
    backgroundColor: '#fff5f5',
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

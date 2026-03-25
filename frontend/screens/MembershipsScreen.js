import { useAuth } from '../AuthContext';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';

const API_URL = 'http://10.0.2.2:5000/api';

const MembershipsScreen = ({ route, navigation }) => {
  const { token, setToken } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const response = await fetch(`${API_URL}/memberships/tiers`);
      if (response.ok) {
        const data = await response.json();
        setTiers(data);
      }
    } catch (error) {
      console.error('Failed to fetch membership tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (tierId, tierName) => {
    setPurchasingId(tierId);
    try {
      const response = await fetch(`${API_URL}/memberships/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tierId })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Welcome to the Museum Family!', `You are now a ${tierName} member.`);
        // Update the app-wide JWT token to reflect the new '{ role: "member" }' payload
        if (setToken) {
          setToken(data.token);
        }
        navigation.navigate('Home'); // Redirect home so they can enjoy their benefits
      } else {
        Alert.alert('Error', data.message || 'Failed to process membership upgrade.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Unable to connect to the server.');
    } finally {
      setPurchasingId(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name} Membership</Text>
      <Text style={styles.price}>${parseFloat(item.price).toFixed(2)} / year</Text>
      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits:</Text>
        {item.benefits.map((benefit, index) => (
          <Text key={index} style={styles.benefitItem}>• {benefit}</Text>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        {purchasingId === item.id ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : (
          <Button
            title={`Join as ${item.name}`}
            onPress={() => handlePurchase(item.id, item.name)}
            color="#007bff"
          />
        )}
      </View>
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
      <Text style={styles.headerTitle}>Become a Member</Text>
      <Text style={styles.subtitle}>Support the arts and unlock exclusive benefits.</Text>
      <FlatList
        data={tiers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: 'gray', textAlign: 'center', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  price: { fontSize: 18, color: '#28a745', fontWeight: 'bold', marginBottom: 10 },
  description: { fontSize: 15, color: '#444', marginBottom: 15, fontStyle: 'italic' },
  benefitsContainer: { marginBottom: 15, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 5 },
  benefitsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  benefitItem: { fontSize: 14, color: '#333', marginBottom: 3, paddingLeft: 5 },
  buttonContainer: { marginTop: 10 },
});

export default MembershipsScreen;

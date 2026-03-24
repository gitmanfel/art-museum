import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Image, ActivityIndicator } from 'react-native';

const API_URL = 'http://10.0.2.2:5000/api';

const HomeScreen = ({ navigation, route }) => {
  const setToken = route.params?.setToken;
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedExhibition();
  }, []);

  const fetchFeaturedExhibition = async () => {
    try {
      const response = await fetch(`${API_URL}/exhibitions/featured`);
      if (response.ok) {
        const data = await response.json();
        setFeatured(data);
      }
    } catch (error) {
      console.error('Failed to fetch featured exhibition:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (setToken) {
      setToken(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>

      <Text style={styles.info}>Open Today: 10:00 AM - 5:00 PM</Text>

      <View style={styles.featuredContainer}>
        <Text style={styles.sectionTitle}>Featured Exhibition</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : featured ? (
          <View style={styles.card}>
            <Image source={{ uri: featured.image_url }} style={styles.image} />
            <Text style={styles.cardTitle}>{featured.title}</Text>
            <Button
              title="View Details"
              onPress={() => navigation.navigate('ExhibitionsStack', {
                screen: 'ExhibitionDetail',
                params: { id: featured.id, title: featured.title }
              })}
            />
          </View>
        ) : (
          <Text>No featured exhibition right now.</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Open Menu" onPress={() => navigation.openDrawer()} />
      </View>

      <View style={styles.logoutContainer}>
        <Button title="Logout" onPress={handleLogout} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5, marginTop: 20 },
  info: { fontSize: 16, color: 'gray', marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10 },
  featuredContainer: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    marginBottom: 10,
    width: '100%',
    maxWidth: 200,
  },
  logoutContainer: {
    marginTop: 20,
    width: '100%',
    maxWidth: 200,
  }
});

export default HomeScreen;

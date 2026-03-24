import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';

const API_URL = 'http://10.0.2.2:5000/api';

const ExhibitionDetailScreen = ({ route }) => {
  const { id } = route.params;
  const [exhibition, setExhibition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExhibitionDetails();
  }, [id]);

  const fetchExhibitionDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/exhibitions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExhibition(data);
      }
    } catch (error) {
      console.error('Failed to fetch exhibition details:', error);
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

  if (!exhibition) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Exhibition not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: exhibition.image_url }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{exhibition.title}</Text>
        <Text style={styles.dateText}>
          {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
        </Text>
        <Text style={styles.description}>{exhibition.description}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default ExhibitionDetailScreen;

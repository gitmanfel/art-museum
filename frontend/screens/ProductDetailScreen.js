import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Button, Alert } from 'react-native';

const API_URL = 'http://10.0.2.2:5000/api';

const ProductDetailScreen = ({ route, navigation }) => {
  const { id, token } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/shop/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to add items to your cart.');
      return;
    }

    setAddingToCart(true);
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: id, quantity: 1 })
      });

      if (response.ok) {
        Alert.alert('Success', 'Item added to cart!');
      } else {
        const errData = await response.json();
        Alert.alert('Error', errData.message || 'Failed to add item to cart.');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', 'Server connection failed.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image_url }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>${parseFloat(product.price).toFixed(2)}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.buttonContainer}>
          {addingToCart ? (
            <ActivityIndicator size="large" color="#28a745" />
          ) : (
            <Button title="Add to Cart" onPress={addToCart} color="#28a745" />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    color: '#28a745',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 30,
  },
  buttonContainer: {
    marginTop: 10,
  }
});

export default ProductDetailScreen;

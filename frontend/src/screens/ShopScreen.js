import React, { useState } from 'react';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

// Mock data based on Image 5
const PRODUCT_IMAGES = [
  { id: '1', uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }, // Watch placeholder
  { id: '2', uri: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { id: '3', uri: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
];

const ShopScreen = () => {
const ShopScreen = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const { addItem, loading } = useCart();

  const onScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (activeIndex !== roundIndex) {
      setActiveIndex(roundIndex);
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 0 ? prev - 1 : 0));

  const handleAddToCart = async () => {
    if (quantity === 0) return;
    const result = await addItem({
      itemType: 'product',
      itemId: 'product-braun-watch',
      quantity,
    });
    if (result.success) {
      Alert.alert('Added to Cart', `${quantity} × Braun Classic Watch added.`, [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.getParent().navigate('Cart') },
      ]);
      setQuantity(0);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Product Image Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {PRODUCT_IMAGES.map((img) => (
            <View key={img.id} style={styles.slide}>
              <Image source={{ uri: img.uri }} style={styles.productImage} />
            </View>
          ))}
        </ScrollView>
        
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {PRODUCT_IMAGES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                i === activeIndex ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>
      </View>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.productTitle}>Braun Classic Watch</Text>
        
        <Text style={styles.productDescription}>
          This Braun watch is a reissue of the original 1970's design from renowned design team Dietrich Lubs and Dieter Rams, both of whom have work featured in the Museum's collection. The large watch features a numbered face, and the smaller watch has only index lines. Made of a matte stainless-steel case, black dial.
        </Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>$160.00</Text>
            <Text style={styles.memberPrice}>$140.00 Member Price</Text>
          </View>
          
          {/* Quantity Selector */}
          <View style={styles.quantitySelector}>
            <TouchableOpacity onPress={decrementQuantity} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity onPress={incrementQuantity} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={quantity === 0 || loading}
          style={[styles.addToCartButton, (quantity === 0 || loading) && styles.addToCartButtonDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.addToCartButtonText}>Add to Cart</Text>
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
  carouselContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8', // Light gray background for product images
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: width * 0.7,
    height: 300,
    resizeMode: 'contain',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#ff4c4c',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
  detailsContainer: {
    padding: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  productDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    marginBottom: 25,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  memberPrice: {
    fontSize: 12,
    color: '#aaa',
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
  },
  addToCartButton: {
    backgroundColor: '#ff4c4c',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 4,
  },
  addToCartButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
  ,
  addToCartButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ShopScreen;

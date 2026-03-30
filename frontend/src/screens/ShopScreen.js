import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useCart } from '../context/CartContext';
import { getProduct } from '../services/catalogue';

const { width } = Dimensions.get('window');

const DEFAULT_PRODUCT_ID = 'product-braun-watch';

const ShopScreen = ({ navigation }) => {
  const [product, setProduct] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError, setProductError] = useState('');
  const { addItem, loading } = useCart();

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      setLoadingProduct(true);
      setProductError('');
      try {
        const data = await getProduct(DEFAULT_PRODUCT_ID);
        if (!isMounted) return;
        setProduct(data);
      } catch (e) {
        if (!isMounted) return;
        setProductError('Could not load product details.');
      } finally {
        if (isMounted) setLoadingProduct(false);
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, []);

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
    if (quantity === 0 || !product) return;
    const result = await addItem({
      itemType: 'product',
      itemId: product.id,
      quantity,
    });
    if (result.success) {
      Alert.alert('Added to Cart', `${quantity} × ${product.name} added.`, [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.getParent().navigate('Cart') },
      ]);
      setQuantity(0);
    }
  };

  if (loadingProduct) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff4c4c" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{productError || 'Product unavailable.'}</Text>
      </View>
    );
  }

  const productImages = (product.images || []).map((uri, i) => ({ id: `${i}`, uri }));

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
          {productImages.map((img) => (
            <View key={img.id} style={styles.slide}>
              <Image source={{ uri: img.uri }} style={styles.productImage} />
            </View>
          ))}
        </ScrollView>
        
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {productImages.map((_, i) => (
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
        <Text style={styles.productTitle}>{product.name}</Text>
        
        <Text style={styles.productDescription}>
          {product.description}
        </Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
            <Text style={styles.memberPrice}>
              ${Number(product.member_price || product.price).toFixed(2)} Member Price
            </Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ff4c4c',
    fontSize: 14,
    textAlign: 'center',
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
  },
  addToCartButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ShopScreen;

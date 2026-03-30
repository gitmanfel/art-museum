import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { useCart } from '../context/CartContext';
import { getProduct, getProducts } from '../services/catalogue';

const { width } = Dimensions.get('window');

const DEFAULT_PRODUCT_ID = 'product-braun-watch';

const ShopScreen = ({ navigation }) => {
  const webPress = (handler) => (Platform.OS === 'web' ? { onClick: handler } : {});
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
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

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const list = await getProducts();
        if (isMounted) {
          setProducts(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (isMounted) {
          setProducts([]);
        }
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadProductById = async (productId) => {
    if (!productId || productId === product?.id) return;
    setLoadingProduct(true);
    setProductError('');
    try {
      const data = await getProduct(productId);
      setProduct(data);
      setQuantity(0);
      setActiveIndex(0);
    } catch (e) {
      setProductError('Could not load product details.');
    } finally {
      setLoadingProduct(false);
    }
  };

  const onScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (activeIndex !== roundIndex) {
      setActiveIndex(roundIndex);
    }
  };

  const stockQuantity = Number(product?.stock_quantity || 0);

  const incrementQuantity = () => {
    setQuantity((prev) => (prev < stockQuantity ? prev + 1 : prev));
  };
  const decrementQuantity = () => setQuantity(prev => (prev > 0 ? prev - 1 : 0));

  const handleAddToCart = async () => {
    if (quantity === 0 || !product) return;
    const result = await addItem({
      itemType: 'product',
      itemId: product.id,
      quantity,
    });
    if (result.success) {
      if (Platform.OS === 'web') {
        navigation.navigate('Cart');
      } else {
        Alert.alert('Added to Cart', `${quantity} × ${product.name} added.`, [
          { text: 'Keep Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => navigation.getParent().navigate('Cart') },
        ]);
      }
      setQuantity(0);
    } else if (result.error) {
      Alert.alert('Could not add item', result.error);
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
            <Text style={styles.stockText}>
              {stockQuantity > 0 ? `${stockQuantity} in stock` : 'Out of stock'}
            </Text>
          </View>
          
          {/* Quantity Selector */}
          <View style={styles.quantitySelector}>
            <Pressable onPress={decrementQuantity} style={styles.qtyBtn} {...webPress(decrementQuantity)}>
              <Text style={styles.qtyBtnText}>-</Text>
            </Pressable>
            <Text style={styles.qtyText}>{quantity}</Text>
            <Pressable
              onPress={incrementQuantity}
              style={styles.qtyBtn}
              disabled={quantity >= stockQuantity}
              {...webPress(incrementQuantity)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleAddToCart}
          disabled={quantity === 0 || loading || stockQuantity === 0}
          style={[styles.addToCartButton, (quantity === 0 || loading || stockQuantity === 0) && styles.addToCartButtonDisabled]}
          {...webPress(handleAddToCart)}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          }
        </Pressable>

        <View style={styles.moreSection}>
          <Text style={styles.moreSectionTitle}>More in Shop</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreList}>
            {products.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => loadProductById(item.id)}
                style={[styles.productCard, item.id === product.id && styles.productCardActive]}
                {...webPress(() => loadProductById(item.id))}
              >
                <Image
                  source={{ uri: item.image_url || item.images?.[0] }}
                  style={styles.productCardImage}
                />
                <Text numberOfLines={1} style={styles.productCardName}>{item.name}</Text>
                <Text style={styles.productCardPrice}>${Number(item.price).toFixed(2)}</Text>
                <Text style={styles.productCardAction}>View details</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
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
  stockText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
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
  moreSection: {
    marginTop: 24,
  },
  moreSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  moreList: {
    paddingRight: 12,
  },
  productCard: {
    width: 130,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
  },
  productCardActive: {
    borderColor: '#ff4c4c',
    backgroundColor: '#fff7f7',
  },
  productCardImage: {
    width: '100%',
    height: 80,
    borderRadius: 4,
    backgroundColor: '#f2f2f2',
    marginBottom: 6,
  },
  productCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222',
  },
  productCardPrice: {
    marginTop: 4,
    fontSize: 12,
    color: '#ff4c4c',
    fontWeight: '700',
  },
  productCardAction: {
    marginTop: 4,
    fontSize: 10,
    color: '#333',
    textDecorationLine: 'underline',
  },
});

export default ShopScreen;

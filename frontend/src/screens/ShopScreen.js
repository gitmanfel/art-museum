import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, Alert, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useCart } from '../context/CartContext';
import { getProduct, getProducts } from '../services/catalogue';

const DEFAULT_PRODUCT_ID = 'product-braun-watch';

const formatCategory = (value) => (value ? value.replace(/-/g, ' ') : 'Museum shop');

const ShopScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
  const slideWidth = width;
  const heroImageWidth = isWide ? Math.min(width * 0.55, 520) : width * 0.7;
  const relatedCardWidth = isCompact ? 156 : isWide ? 210 : 178;

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
  const memberPrice = Number(product?.member_price || product?.price || 0);
  const standardPrice = Number(product?.price || 0);
  const savings = Math.max(0, standardPrice - memberPrice);

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
            <View key={img.id} style={[styles.slide, { width: slideWidth }]}>
              <Image source={{ uri: img.uri }} style={[styles.productImage, { width: heroImageWidth }]} />
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
      <View style={[styles.detailsContainer, isCompact && styles.detailsContainerCompact, isWide && styles.detailsContainerWide]}>
        <View style={styles.productBadgeRow}>
          <Text style={styles.productBadge}>{formatCategory(product.category)}</Text>
          {savings > 0 ? <Text style={styles.savingsBadge}>Save ${savings.toFixed(2)} as member</Text> : null}
        </View>
        <Text style={[styles.productTitle, isCompact && styles.productTitleCompact, isWide && styles.productTitleWide]}>{product.name}</Text>
        
        <Text style={[styles.productDescription, isWide && styles.productDescriptionWide]}>
          {product.description}
        </Text>

        <View style={styles.priceRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
            <Text style={styles.memberPrice}>
              ${memberPrice.toFixed(2)} Member Price
            </Text>
            <Text style={styles.stockText}>
              {stockQuantity > 0 ? `${stockQuantity} in stock` : 'Out of stock'}
            </Text>
          </View>
          
          {/* Quantity Selector */}
          <View style={[styles.quantitySelector, isCompact && styles.quantitySelectorCompact]}>
            <Pressable
              onPress={decrementQuantity}
              style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
              {...webPress(decrementQuantity)}
              accessibilityRole="button"
              accessibilityLabel="Decrease product quantity"
              hitSlop={8}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </Pressable>
            <Text style={styles.qtyText}>{quantity}</Text>
            <Pressable
              onPress={incrementQuantity}
              style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
              disabled={quantity >= stockQuantity}
              {...webPress(incrementQuantity)}
              accessibilityRole="button"
              accessibilityLabel="Increase product quantity"
              hitSlop={8}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleAddToCart}
          disabled={quantity === 0 || loading || stockQuantity === 0}
          style={({ pressed }) => [
            styles.addToCartButton,
            (quantity === 0 || loading || stockQuantity === 0) && styles.addToCartButtonDisabled,
            pressed && quantity > 0 && !loading && stockQuantity > 0 && styles.addToCartButtonPressed,
          ]}
          {...webPress(handleAddToCart)}
          accessibilityRole="button"
          accessibilityLabel={`Add ${quantity} ${product.name} to cart`}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          }
        </Pressable>

        <View style={styles.moreSection}>
          <Text style={[styles.moreSectionTitle, isWide && styles.moreSectionTitleWide]}>More in Shop</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreList}>
            {products.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => loadProductById(item.id)}
                style={({ pressed }) => [
                  styles.productCard,
                  { width: relatedCardWidth },
                  item.id === product.id && styles.productCardActive,
                  pressed && styles.productCardPressed,
                ]}
                {...webPress(() => loadProductById(item.id))}
                accessibilityRole="button"
                accessibilityLabel={`Preview shop item ${item.name}`}
              >
                <Image
                  source={{ uri: item.image_url || item.images?.[0] }}
                  style={styles.productCardImage}
                />
                <Text style={styles.productCardBadge}>{formatCategory(item.category)}</Text>
                <Text numberOfLines={2} style={styles.productCardName}>{item.name}</Text>
                <View style={styles.productCardPriceRow}>
                  <Text style={styles.productCardPrice}>${Number(item.price).toFixed(2)}</Text>
                  {Number(item.member_price || item.price) < Number(item.price) ? (
                    <Text style={styles.productCardMember}>Member ${Number(item.member_price).toFixed(2)}</Text>
                  ) : null}
                </View>
                <Text style={styles.productCardAction}>Preview item</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
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
  detailsContainerWide: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
  },
  detailsContainerCompact: {
    padding: 14,
  },
  productBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  productBadge: {
    backgroundColor: '#f6eadc',
    color: '#8f4f1b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savingsBadge: {
    backgroundColor: '#eef5ea',
    color: '#3d6a37',
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  productTitleCompact: {
    fontSize: 21,
    marginBottom: 12,
  },
  productTitleWide: {
    fontSize: 30,
    marginBottom: 18,
  },
  productDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    marginBottom: 25,
  },
  productDescriptionWide: {
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 760,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  priceBlock: {
    flex: 1,
    paddingRight: 10,
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
  quantitySelectorCompact: {
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  qtyBtnPressed: {
    backgroundColor: '#f2f2f2',
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
  addToCartButtonPressed: {
    backgroundColor: '#e44343',
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
  moreSectionTitleWide: {
    fontSize: 18,
    marginBottom: 12,
  },
  moreList: {
    paddingRight: 12,
  },
  productCard: {
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#eadccf',
    borderRadius: 18,
    padding: 10,
    backgroundColor: '#fff',
  },
  productCardActive: {
    borderColor: '#d9732f',
    backgroundColor: '#fff8f1',
  },
  productCardPressed: {
    opacity: 0.86,
  },
  productCardImage: {
    width: '100%',
    height: 118,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    marginBottom: 8,
  },
  productCardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f6eadc',
    color: '#8f4f1b',
    fontSize: 9,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  productCardName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    minHeight: 34,
  },
  productCardPriceRow: {
    marginTop: 8,
  },
  productCardPrice: {
    fontSize: 12,
    color: '#b64d17',
    fontWeight: '700',
  },
  productCardMember: {
    marginTop: 2,
    fontSize: 10,
    color: '#55704d',
    fontWeight: '600',
  },
  productCardAction: {
    marginTop: 8,
    fontSize: 10,
    color: '#284960',
    fontWeight: '700',
  },
});

export default ShopScreen;

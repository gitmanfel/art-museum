import React from 'react';
import { View, StyleSheet, TextInput, Text, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import ExhibitionScreen from '../screens/ExhibitionScreen';
import ShopScreen from '../screens/ShopScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ContactScreen from '../screens/ContactScreen';
import TicketsScreen from '../screens/TicketsScreen';
import MembershipScreen from '../screens/MembershipScreen';
import ArtistsScreen from '../screens/ArtistsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ContentManagementScreen from '../screens/ContentManagementScreen';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Drawer = createDrawerNavigator();

// Cart icon shown in every drawer screen's header
const CartHeaderButton = ({ navigation }) => {
  const { itemCount } = useCart();
  const { user } = useAuth();

  const roleLabel = user?.role === 'member'
    ? 'MEMBER'
    : user?.role === 'admin'
      ? 'ADMIN'
      : null;

  return (
    <View style={styles.headerActions}>
      {roleLabel ? (
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{roleLabel}</Text>
        </View>
      ) : null}
      <TouchableOpacity
        onPress={() => navigation.getParent().navigate('Cart')}
        style={styles.cartBtn}
        accessibilityLabel="Open cart"
      >
        <Text style={styles.cartIcon}>🛒</Text>
        {itemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Custom Drawer component to match the Prototype (Image 3)
const CustomDrawerContent = (props) => {
  const { clearSession } = useAuth();

  const handleLogout = async () => {
    await clearSession();
    props.navigation.closeDrawer();
    props.navigation.getParent()?.navigate('Login');
  };

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      <View style={styles.searchContainer}>
        {/* Placeholder for an actual icon */}
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search" 
          placeholderTextColor="#fff"
        />
      </View>
      
      {/* DrawerItemList automatically renders the defined screens */}
      <DrawerItemList {...props} />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

const MainNavigator = () => {
  const { user } = useAuth();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true, // Prototype shows a header with a hamburger menu
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitle: "THE ART MUSEUM",
        headerTitleStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            letterSpacing: 2,
        },
        headerTintColor: '#000',
        headerRight: () => <CartHeaderButton navigation={navigation} />,
        drawerStyle: {
          backgroundColor: '#ff4c4c', // Signature Red from prototype
          width: 280,
        },
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#fff',
        drawerLabelStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginLeft: -15, // Bring text closer to edge if icons are missing
        },
      })}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ drawerLabel: 'Home' }} 
      />
      <Drawer.Screen 
        name="Exhibitions & Events" 
        component={ExhibitionScreen} 
        options={{ drawerLabel: 'Exhibitions & Events' }} 
      />
      <Drawer.Screen 
        name="Artists & Artworks" 
        component={ArtistsScreen} 
        options={{ drawerLabel: 'Artists & Artworks' }} 
      />
      <Drawer.Screen 
        name="Collections" 
        component={CollectionsScreen} 
        options={{ drawerLabel: 'Collections' }} 
      />
      <Drawer.Screen 
        name="Plan Your Visit" 
        component={TicketsScreen} 
        options={{ drawerLabel: 'Plan Your Visit' }} 
      />
      <Drawer.Screen 
        name="Become a Member" 
        component={MembershipScreen} 
        options={{ drawerLabel: 'Become a Member' }} 
      />
      <Drawer.Screen 
        name="Shop" 
        component={ShopScreen} 
        options={{ drawerLabel: 'Shop' }} 
      />
      <Drawer.Screen
        name="My Orders"
        component={OrdersScreen}
        options={{ drawerLabel: 'My Orders' }}
      />
      <Drawer.Screen
        name="Contact"
        component={ContactScreen}
        options={{ drawerLabel: 'Contact' }}
      />
      <Drawer.Screen
        name="Admin Dashboard"
        component={AdminDashboardScreen}
        options={{ drawerLabel: 'Admin Dashboard' }}
      />
      <Drawer.Screen
        name="Content Manager"
        component={ContentManagementScreen}
        options={{ drawerLabel: 'Content Manager' }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: '#ff4c4c',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    margin: 20,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    color: '#fff',
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  }
  ,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rolePill: {
    backgroundColor: '#111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
  },
  rolePillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cartBtn: {
    marginRight: 16,
    padding: 4,
  },
  cartIcon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 8,
    backgroundColor: '#ff4c4c',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default MainNavigator;

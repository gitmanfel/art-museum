import React from 'react';
import { View, StyleSheet, TextInput, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import ExhibitionScreen from '../screens/ExhibitionScreen';
import ShopScreen from '../screens/ShopScreen';
import TicketsScreen from '../screens/TicketsScreen';
import MembershipScreen from '../screens/MembershipScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer component to match the Prototype (Image 3)
const CustomDrawerContent = (props) => {
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
    </DrawerContentScrollView>
  );
};

const MainNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
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
      }}
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
        component={PlaceholderScreen}
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
});

export default MainNavigator;

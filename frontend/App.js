import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './AuthContext';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ExhibitionsScreen from './screens/ExhibitionsScreen';
import ExhibitionDetailScreen from './screens/ExhibitionDetailScreen';
import ShopScreen from './screens/ShopScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import CartScreen from './screens/CartScreen';
import TicketsScreen from './screens/TicketsScreen';
import MyBookingsScreen from './screens/MyBookingsScreen';
import MembershipsScreen from './screens/MembershipsScreen';
import CheckoutScreen from './screens/CheckoutScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const ExhibitionsStack = createNativeStackNavigator();
const ShopStack = createNativeStackNavigator();
const TicketsStack = createNativeStackNavigator();
const MembershipsStack = createNativeStackNavigator();

function ExhibitionsStackNavigator() {
  return (
    <ExhibitionsStack.Navigator>
      <ExhibitionsStack.Screen
        name="ExhibitionsList"
        component={ExhibitionsScreen}
        options={{ headerShown: false }}
      />
      <ExhibitionsStack.Screen
        name="ExhibitionDetail"
        component={ExhibitionDetailScreen}
        options={({ route }) => ({ title: route.params.title || 'Details' })}
      />
    </ExhibitionsStack.Navigator>
  );
}

function ShopStackNavigator() {
  return (
    <ShopStack.Navigator>
      <ShopStack.Screen
        name="Shop"
        component={ShopScreen}
        options={{ headerShown: false }}
      />
      <ShopStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params.title || 'Product' })}
      />
      <ShopStack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Your Cart' }}
      />
      <ShopStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
    </ShopStack.Navigator>
  );
}

function TicketsStackNavigator() {
  return (
    <TicketsStack.Navigator>
      <TicketsStack.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{ headerShown: false }}
      />
      <TicketsStack.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ title: 'My Bookings' }}
      />
      <TicketsStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
    </TicketsStack.Navigator>
  );
}

function MembershipsStackNavigator() {
  return (
    <MembershipsStack.Navigator>
      <MembershipsStack.Screen
        name="Memberships"
        component={MembershipsScreen}
        options={{ headerShown: false }}
      />
    </MembershipsStack.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Art Museum' }}
      />
      <Drawer.Screen
        name="ExhibitionsStack"
        component={ExhibitionsStackNavigator}
        options={{ title: 'Exhibitions & Collections' }}
      />
      <Drawer.Screen
        name="ShopStack"
        component={ShopStackNavigator}
        options={{ title: 'Museum Shop' }}
      />
      <Drawer.Screen
        name="TicketsStack"
        component={TicketsStackNavigator}
        options={{ title: 'Buy Tickets' }}
      />
      <Drawer.Screen
        name="MembershipsStack"
        component={MembershipsStackNavigator}
        options={{ title: 'Become a Member' }}
      />
    </Drawer.Navigator>
  );
}

function RootNavigator() {
  const { token } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: true, title: 'Sign Up' }}
            />
          </>
        ) : (
          <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import 'react-native-gesture-handler';

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

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const ExhibitionsStack = createNativeStackNavigator();
const ShopStack = createNativeStackNavigator();
const TicketsStack = createNativeStackNavigator();

// Nested Stack for Exhibitions to handle details
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

// Nested Stack for Shop & Cart to handle Epic 4
function ShopStackNavigator({ token }) {
  return (
    <ShopStack.Navigator>
      <ShopStack.Screen
        name="Shop"
        component={ShopScreen}
        options={{ headerShown: false }}
        initialParams={{ token }}
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
    </ShopStack.Navigator>
  );
}

// Nested Stack for Tickets to handle Epic 5
function TicketsStackNavigator({ token }) {
  return (
    <TicketsStack.Navigator>
      <TicketsStack.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{ headerShown: false }}
        initialParams={{ token }}
      />
      <TicketsStack.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ title: 'My Bookings' }}
        initialParams={{ token }}
      />
    </TicketsStack.Navigator>
  );
}

// Drawer Navigator for Main Navigation
function DrawerNavigator({ setToken, token }) {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Art Museum' }}
        initialParams={{ setToken }}
      />
      <Drawer.Screen
        name="ExhibitionsStack"
        component={ExhibitionsStackNavigator}
        options={{ title: 'Exhibitions & Collections' }}
      />
      <Drawer.Screen
        name="ShopStack"
        options={{ title: 'Museum Shop' }}
      >
        {props => <ShopStackNavigator {...props} token={token} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="TicketsStack"
        options={{ title: 'Buy Tickets' }}
      >
        {props => <TicketsStackNavigator {...props} token={token} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

// Main Stack Navigator conditionally rendering Auth vs Main Flow
export default function App() {
  const [token, setToken] = useState(null);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null ? (
          // No token found, user isn't signed in
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              initialParams={{ setToken }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: true, title: 'Sign Up' }}
              initialParams={{ setToken }}
            />
          </>
        ) : (
          // User is signed in
          <Stack.Screen name="MainDrawer">
             {props => <DrawerNavigator {...props} setToken={setToken} token={token} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

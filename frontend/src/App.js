import 'react-native-gesture-handler'; // Required for Drawer Navigator
import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import CartScreen from './screens/CartScreen';
import PaymentScreen from './screens/PaymentScreen';
import CheckoutStatusScreen from './screens/CheckoutStatusScreen';
import MainNavigator from './navigation/MainNavigator';

const Stack = createNativeStackNavigator();
const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function App() {
  return (
    <StripeProvider publishableKey={stripePublishableKey} merchantIdentifier="merchant.com.artmuseum">
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ title: 'Your Cart', headerTintColor: '#000' }}
            />
              <Stack.Screen
                name="Payment"
                component={PaymentScreen}
                options={{ title: 'Secure Payment', headerTintColor: '#000' }}
              />
              <Stack.Screen
                name="CheckoutStatus"
                component={CheckoutStatusScreen}
                options={{ title: 'Checkout Status', headerTintColor: '#000' }}
              />
              {/* The MainNavigator contains the Drawer and the rest of the app */}
              <Stack.Screen
                name="Main"
                component={MainNavigator}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </StripeProvider>
  );
}

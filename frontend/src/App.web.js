import 'react-native-gesture-handler'; // Required for Drawer Navigator
import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
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

const LEFT_ART = 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=80';
const RIGHT_ART = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80';

export default function App() {
  const { width } = useWindowDimensions();
  const showSideArt = width >= 1100;

  return (
    <View style={styles.pageRoot}>
      {showSideArt ? (
        <>
          <Image source={{ uri: LEFT_ART }} style={[styles.sideArt, styles.sideLeft]} resizeMode="cover" />
          <Image source={{ uri: RIGHT_ART }} style={[styles.sideArt, styles.sideRight]} resizeMode="cover" />
        </>
      ) : null}

      <View style={[styles.appShell, showSideArt && styles.appShellDesktop]}>
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
                <Stack.Screen
                  name="Main"
                  component={MainNavigator}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </CartProvider>
        </AuthProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: '#f2eee8',
  },
  sideArt: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '22%',
    opacity: 0.24,
  },
  sideLeft: {
    left: 0,
  },
  sideRight: {
    right: 0,
  },
  appShell: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
  },
  appShellDesktop: {
    maxWidth: 980,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e9e2d7',
  },
});

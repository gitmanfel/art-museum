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

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const ExhibitionsStack = createNativeStackNavigator();

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

// Drawer Navigator for Epic 2: Main Navigation
function DrawerNavigator({ setToken }) {
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
             {props => <DrawerNavigator {...props} setToken={setToken} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

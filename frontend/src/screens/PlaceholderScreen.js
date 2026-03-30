import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

const PlaceholderScreen = ({ route }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: isCompact ? 18 : 20 }]} accessibilityRole="header">{route.name} Content</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontWeight: 'bold',
    color: '#111',
  },
});

export default PlaceholderScreen;

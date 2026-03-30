import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';

const HomeScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
  const webPress = (handler) => (Platform.OS === 'web' ? { onClick: handler } : {});

  return (
    <ScrollView style={styles.container}>
      {/* Header Image / Featured Exhibition */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1544335448-f62d1c68fce1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
        style={[styles.heroImage, { height: isCompact ? 240 : isWide ? 380 : 300, width: '100%' }]}
      />
      
      <View style={[styles.contentContainer, { paddingHorizontal: isCompact ? 14 : 20, paddingVertical: isCompact ? 16 : 20 }]}>
        <Text style={[styles.categoryText, { fontSize: isCompact ? 10 : 12, marginBottom: isCompact ? 8 : 10 }]}>EXHIBITION</Text>
        <Text style={[styles.titleText, { fontSize: isCompact ? 26 : isWide ? 40 : 32, lineHeight: isCompact ? 30 : isWide ? 46 : 38, marginBottom: isCompact ? 10 : 15 }]}>MASTERS{'\n'}OLD AND{'\n'}NEW</Text>
        <Text style={[styles.dateText, { fontSize: isCompact ? 14 : isWide ? 18 : 16, marginBottom: isCompact ? 4 : 5 }]}>APRIL 15 - SEPTEMBER 20</Text>
        <Text style={[styles.floorText, { fontSize: isCompact ? 11 : 12, marginBottom: isCompact ? 22 : 30 }]}>FLOOR 5</Text>
        
        <Pressable 
          style={({ pressed }) => [styles.planVisitButton, { paddingVertical: isCompact ? 12 : 15, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => navigation.navigate('Plan Your Visit')}
          {...webPress(() => navigation.navigate('Plan Your Visit'))}
          accessibilityRole="button"
          accessibilityLabel="Plan your visit button"
          accessibilityHint="Opens information about visiting the museum"
        >
          <Text style={[styles.planVisitButtonText, { fontSize: isCompact ? 14 : 16 }]}>Plan Your Visit</Text>
        </Pressable>
        
        {/* Footer Info (Location and Hours) */}
        <View style={[styles.footerContainer, { paddingTop: isCompact ? 16 : 20, marginTop: isCompact ? 20 : 40 }]}>
          <View style={styles.infoBlock}>
            <Text style={[styles.icon, { fontSize: isCompact ? 16 : 18 }]} accessibilityLabel="Location icon" accessibilityRole="image">📍</Text>
            <View>
              <Text style={[styles.infoTextPrimary, { fontSize: isCompact ? 13 : 14 }]}>151 3rd St</Text>
              <Text style={[styles.infoTextSecondary, { fontSize: isCompact ? 11 : 12 }]}>San Francisco, CA 94103</Text>
            </View>
          </View>
          
          <View style={styles.infoBlock}>
            <Text style={[styles.icon, { fontSize: isCompact ? 16 : 18 }]} accessibilityLabel="Clock icon" accessibilityRole="image">🕒</Text>
            <View>
              <Text style={[styles.infoTextPrimary, { fontSize: isCompact ? 13 : 14 }]}>Open today</Text>
              <Text style={[styles.infoTextSecondary, { fontSize: isCompact ? 11 : 12 }]}>10:00am — 5:30pm</Text>
            </View>
          </View>
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
  heroImage: {
    resizeMode: 'cover',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  categoryText: {
    color: '#888',
    letterSpacing: 1,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  titleText: {
    fontWeight: 'bold',
    color: '#000',
  },
  dateText: {
    fontSize: 16,
    color: '#ff4c4c', // Prototype red
    fontWeight: 'bold',
    marginBottom: 5,
  },
  floorText: {
    fontSize: 12,
    color: '#aaa',
    textTransform: 'uppercase',
    marginBottom: 30,
  },
  planVisitButton: {
    backgroundColor: '#ff4c4c',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 4,
    marginBottom: 40,
    shadowColor: '#ff4c4c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  planVisitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 20,
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
    color: '#ff4c4c',
  },
  infoTextPrimary: {
    fontSize: 14,
    color: '#ff4c4c',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoTextSecondary: {
    fontSize: 12,
    color: '#888',
  }
});

export default HomeScreen;

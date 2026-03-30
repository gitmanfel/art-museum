import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      {/* Header Image / Featured Exhibition */}
      <Image
        // In a real app, this would be fetched from AWS S3 via CloudFront
        source={{ uri: 'https://images.unsplash.com/photo-1544335448-f62d1c68fce1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} // Placeholder painting
        style={styles.heroImage}
      />
      
      <View style={styles.contentContainer}>
        <Text style={styles.categoryText}>EXHIBITION</Text>
        <Text style={styles.titleText}>MASTERS{'\n'}OLD AND{'\n'}NEW</Text>
        <Text style={styles.dateText}>APRIL 15 - SEPTEMBER 20</Text>
        <Text style={styles.floorText}>FLOOR 5</Text>
        
        <TouchableOpacity 
          style={styles.planVisitButton}
          onPress={() => navigation.navigate('Plan Your Visit')}
        >
          <Text style={styles.planVisitButtonText}>Plan Your Visit</Text>
        </TouchableOpacity>
        
        {/* Footer Info (Location and Hours) */}
        <View style={styles.footerContainer}>
          <View style={styles.infoBlock}>
            <Text style={styles.icon}>📍</Text>
            <View>
              <Text style={styles.infoTextPrimary}>151 3rd St</Text>
              <Text style={styles.infoTextSecondary}>San Francisco, CA 94103</Text>
            </View>
          </View>
          
          <View style={styles.infoBlock}>
            <Text style={styles.icon}>🕒</Text>
            <View>
              <Text style={styles.infoTextPrimary}>Open today</Text>
              <Text style={styles.infoTextSecondary}>10:00am — 5:30pm</Text>
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
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 20,
  },
  categoryText: {
    fontSize: 12,
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 38,
    marginBottom: 15,
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

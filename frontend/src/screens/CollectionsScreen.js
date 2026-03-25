import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, FlatList, TouchableOpacity } from 'react-native';

// Mock data representing the collections based on Image 6
const COLLECTIONS_DATA = [
  { id: '1', title: 'DECORATIVE\nARTS & CRAFTS', image: 'https://images.unsplash.com/photo-1570114668581-22904c6436f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: '2', title: 'AMERICAN\nIMPRESSIONISM', image: 'https://images.unsplash.com/photo-1544335448-f62d1c68fce1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: '3', title: 'DE STIJL', image: 'https://images.unsplash.com/photo-1573510599544-785c4fc2195f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: '4', title: 'CUBISM', image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: '5', title: 'AMERICAN', image: 'https://images.unsplash.com/photo-1507676184212-d0c30a512683?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: '6', title: 'GREEK ANTIQUITIES', image: 'https://images.unsplash.com/photo-1563289063-e3810bd60249?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
];

const CollectionsScreen = () => {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.gridItem}>
      <Image source={{ uri: item.image }} style={styles.collectionImage} />
      <Text style={styles.collectionTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Explore the Collection"
            placeholderTextColor="#ff4c4c"
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.advancedSearchText}>Advanced Search</Text>
        </TouchableOpacity>
      </View>

      {/* Grid Section */}
      <FlatList
        data={COLLECTIONS_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchSection: {
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4c4c',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ff4c4c',
    fontSize: 16,
  },
  searchIcon: {
    fontSize: 18,
    color: '#ff4c4c',
  },
  advancedSearchText: {
    color: '#ff4c4c',
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '48%', // Leaves a small gap between 2 columns
  },
  collectionImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    marginBottom: 8,
  },
  collectionTitle: {
    color: '#ff4c4c',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  }
});

export default CollectionsScreen;

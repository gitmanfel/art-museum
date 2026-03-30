import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

const ARTISTS = [
  {
    id: '1',
    name: 'Dorothea Lange',
    dates: '1895 – 1965',
    medium: 'Photography',
    image: 'https://images.unsplash.com/photo-1555620956-f64f895fbcd0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Influential documentary photographer best known for her Depression-era work for the Farm Security Administration.',
  },
  {
    id: '2',
    name: 'Gerrit Rietveld',
    dates: '1888 – 1964',
    medium: 'Design & Architecture',
    image: 'https://images.unsplash.com/photo-1573510599544-785c4fc2195f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'De Stijl architect and furniture designer famous for the Red and Blue Chair and the Rietveld Schröder House.',
  },
  {
    id: '3',
    name: 'Pablo Picasso',
    dates: '1881 – 1973',
    medium: 'Painting & Sculpture',
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Co-founder of Cubism and one of the most influential artists of the 20th century.',
  },
  {
    id: '4',
    name: 'Winslow Homer',
    dates: '1836 – 1910',
    medium: 'Painting',
    image: 'https://images.unsplash.com/photo-1544335448-f62d1c68fce1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'American Realism painter celebrated for his seascapes and Civil War scenes.',
  },
  {
    id: '5',
    name: 'Dieter Rams',
    dates: '1932 –',
    medium: 'Industrial Design',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Designer at Braun whose "Ten Principles of Good Design" shaped generations of product designers.',
  },
];

const CARD_WIDTH = (width - 48) / 2;

const ArtistsScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Exhibitions & Events')}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardDates}>{item.dates}</Text>
        <Text style={styles.cardMedium}>{item.medium}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Artists &{'\n'}Artworks</Text>
        <Text style={styles.headerSub}>Works from the permanent collection</Text>
      </View>
      <FlatList
        data={ARTISTS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  headerSection:{ padding: 20, paddingBottom: 10 },
  headerTitle:  { fontSize: 28, fontWeight: 'bold', color: '#000', lineHeight: 34, marginBottom: 6 },
  headerSub:    { fontSize: 13, color: '#aaa' },
  grid:         { paddingHorizontal: 16, paddingBottom: 20 },
  row:          { justifyContent: 'space-between', marginBottom: 20 },
  card:         { width: CARD_WIDTH },
  cardImage:    { width: '100%', height: 180, resizeMode: 'cover', backgroundColor: '#f0f0f0' },
  cardBody:     { paddingTop: 8 },
  cardName:     { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  cardDates:    { fontSize: 11, color: '#aaa', marginBottom: 1 },
  cardMedium:   { fontSize: 11, color: '#ff4c4c', fontWeight: '600' },
});

export default ArtistsScreen;

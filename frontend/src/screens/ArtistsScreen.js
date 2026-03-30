import React, { useMemo, useState } from 'react';
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
    works: ['Migrant Mother', 'White Angel Breadline', 'American Exodus'],
  },
  {
    id: '2',
    name: 'Gerrit Rietveld',
    dates: '1888 – 1964',
    medium: 'Design & Architecture',
    image: 'https://images.unsplash.com/photo-1573510599544-785c4fc2195f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'De Stijl architect and furniture designer famous for the Red and Blue Chair and the Rietveld Schröder House.',
    works: ['Red and Blue Chair', 'Rietveld Schröder House', 'Zig-Zag Chair'],
  },
  {
    id: '3',
    name: 'Pablo Picasso',
    dates: '1881 – 1973',
    medium: 'Painting & Sculpture',
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Co-founder of Cubism and one of the most influential artists of the 20th century.',
    works: ['Guernica', "Les Demoiselles d'Avignon", 'The Weeping Woman'],
  },
  {
    id: '4',
    name: 'Winslow Homer',
    dates: '1836 – 1910',
    medium: 'Painting',
    image: 'https://images.unsplash.com/photo-1544335448-f62d1c68fce1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'American Realism painter celebrated for his seascapes and Civil War scenes.',
    works: ['The Gulf Stream', 'Breezing Up', 'Northeaster'],
  },
  {
    id: '5',
    name: 'Dieter Rams',
    dates: '1932 –',
    medium: 'Industrial Design',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Designer at Braun whose "Ten Principles of Good Design" shaped generations of product designers.',
    works: ['Braun SK4', 'Braun T3 Pocket Radio', '606 Universal Shelving'],
  },
];

const CARD_WIDTH = (width - 48) / 2;

const ArtistsScreen = () => {
  const [selectedArtistId, setSelectedArtistId] = useState(ARTISTS[0]?.id || null);

  const selectedArtist = useMemo(
    () => ARTISTS.find((artist) => artist.id === selectedArtistId) || ARTISTS[0],
    [selectedArtistId]
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, selectedArtistId === item.id && styles.cardSelected]}
      onPress={() => setSelectedArtistId(item.id)}
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
        ListFooterComponent={
          selectedArtist ? (
            <View style={styles.reviewPanel}>
              <Text style={styles.reviewTitle}>{selectedArtist.name}</Text>
              <Text style={styles.reviewDates}>{selectedArtist.dates} • {selectedArtist.medium}</Text>
              <Text style={styles.reviewBio}>{selectedArtist.bio}</Text>
              <Text style={styles.workHeading}>Featured Works</Text>
              {selectedArtist.works.map((work) => (
                <Text key={work} style={styles.workItem}>• {work}</Text>
              ))}
            </View>
          ) : null
        }
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
  cardSelected: { opacity: 0.85 },
  cardImage:    { width: '100%', height: 180, resizeMode: 'cover', backgroundColor: '#f0f0f0' },
  cardBody:     { paddingTop: 8 },
  cardName:     { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  cardDates:    { fontSize: 11, color: '#aaa', marginBottom: 1 },
  cardMedium:   { fontSize: 11, color: '#ff4c4c', fontWeight: '600' },
  reviewPanel: {
    marginTop: 8,
    backgroundColor: '#fff6f6',
    borderWidth: 1,
    borderColor: '#ffd1d1',
    borderRadius: 8,
    padding: 14,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  reviewDates: {
    marginTop: 4,
    color: '#ff4c4c',
    fontWeight: '600',
    fontSize: 12,
  },
  reviewBio: {
    marginTop: 8,
    color: '#444',
    lineHeight: 18,
    fontSize: 13,
  },
  workHeading: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  workItem: {
    marginTop: 4,
    color: '#444',
    fontSize: 12,
  },
});

export default ArtistsScreen;

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

const ARTISTS = [
  {
    id: '1',
    name: 'Dorothea Lange',
    dates: '1895 – 1965',
    medium: 'Photography',
    image: 'https://images.unsplash.com/photo-1555620956-f64f895fbcd0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Influential documentary photographer best known for her Depression-era work for the Farm Security Administration.',
    works: [
      { id: 'lange-1', title: 'Migrant Mother', year: 1936, medium: 'Gelatin silver print' },
      { id: 'lange-2', title: 'White Angel Breadline', year: 1933, medium: 'Photograph' },
      { id: 'lange-3', title: 'American Exodus', year: 1939, medium: 'Gelatin silver print' },
    ],
  },
  {
    id: '2',
    name: 'Gerrit Rietveld',
    dates: '1888 – 1964',
    medium: 'Design & Architecture',
    image: 'https://images.unsplash.com/photo-1573510599544-785c4fc2195f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'De Stijl architect and furniture designer famous for the Red and Blue Chair and the Rietveld Schröder House.',
    works: [
      { id: 'rietveld-1', title: 'Red and Blue Chair', year: 1917, medium: 'Painted wood' },
      { id: 'rietveld-2', title: 'Rietveld Schrode House', year: 1924, medium: 'Architecture' },
      { id: 'rietveld-3', title: 'Zig-Zag Chair', year: 1934, medium: 'Lacquered wood' },
    ],
  },
  {
    id: '3',
    name: 'Pablo Picasso',
    dates: '1881 – 1973',
    medium: 'Painting & Sculpture',
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Co-founder of Cubism and one of the most influential artists of the 20th century.',
    works: [
      { id: 'picasso-1', title: 'Guernica', year: 1937, medium: 'Oil on canvas' },
      { id: 'picasso-2', title: "Les Demoiselles d'Avignon", year: 1907, medium: 'Oil on canvas' },
      { id: 'picasso-3', title: 'The Weeping Woman', year: 1937, medium: 'Oil on canvas' },
    ],
  },
  {
    id: '4',
    name: 'Winslow Homer',
    dates: '1836 – 1910',
    medium: 'Painting',
    image: 'https://images.unsplash.com/photo-1544335448-f62d1c68fce1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'American Realism painter celebrated for his seascapes and Civil War scenes.',
    works: [
      { id: 'homer-1', title: 'The Gulf Stream', year: 1899, medium: 'Oil on canvas' },
      { id: 'homer-2', title: 'Breezing Up', year: 1876, medium: 'Oil on canvas' },
      { id: 'homer-3', title: 'Northeaster', year: 1895, medium: 'Oil on canvas' },
    ],
  },
  {
    id: '5',
    name: 'Dieter Rams',
    dates: '1932 –',
    medium: 'Industrial Design',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    bio: 'Designer at Braun whose "Ten Principles of Good Design" shaped generations of product designers.',
    works: [
      { id: 'rams-1', title: 'Braun SK4', year: 1956, medium: 'Product design' },
      { id: 'rams-2', title: 'Braun T3 Pocket Radio', year: 1958, medium: 'Product design' },
      { id: 'rams-3', title: '606 Universal Shelving', year: 1960, medium: 'Furniture system' },
    ],
  },
];

const CARD_WIDTH = (width - 48) / 2;
const PAGE_SIZE = 4;

const ArtistsScreen = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedArtistId, setSelectedArtistId] = useState(ARTISTS[0]?.id || null);
  const [selectedArtworkId, setSelectedArtworkId] = useState(null);

  const totalPages = Math.ceil(ARTISTS.length / PAGE_SIZE);

  const pagedArtists = useMemo(
    () => ARTISTS.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [currentPage]
  );

  useEffect(() => {
    if (!pagedArtists.some((artist) => artist.id === selectedArtistId)) {
      setSelectedArtistId(pagedArtists[0]?.id || null);
    }
  }, [pagedArtists, selectedArtistId]);

  const selectedArtist = useMemo(
    () => ARTISTS.find((artist) => artist.id === selectedArtistId) || ARTISTS[0],
    [selectedArtistId]
  );

  const selectedArtwork = useMemo(() => {
    if (!selectedArtist?.works?.length) return null;
    return selectedArtist.works.find((work) => work.id === selectedArtworkId) || selectedArtist.works[0];
  }, [selectedArtist, selectedArtworkId]);

  useEffect(() => {
    setSelectedArtworkId(selectedArtist?.works?.[0]?.id || null);
  }, [selectedArtistId]);

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
        <Text style={styles.cardAction}>View details</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Artists &{'\n'}Artworks</Text>
        <Text style={styles.headerSub}>Works from the permanent collection</Text>
      </View>
      <View style={styles.paginationBar}>
        <TouchableOpacity
          style={[styles.pageBtn, currentPage === 0 && styles.pageBtnDisabled]}
          disabled={currentPage === 0}
          onPress={() => setCurrentPage((page) => Math.max(0, page - 1))}
        >
          <Text style={styles.pageBtnText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.pageText}>Page {currentPage + 1} / {totalPages}</Text>
        <TouchableOpacity
          style={[styles.pageBtn, currentPage >= totalPages - 1 && styles.pageBtnDisabled]}
          disabled={currentPage >= totalPages - 1}
          onPress={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
        >
          <Text style={styles.pageBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={pagedArtists}
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
              {selectedArtist.works.map((work) => {
                const active = selectedArtwork?.id === work.id;
                return (
                  <TouchableOpacity
                    key={work.id}
                    onPress={() => setSelectedArtworkId(work.id)}
                    style={[styles.workItemBtn, active && styles.workItemBtnActive]}
                  >
                    <Text style={[styles.workItem, active && styles.workItemActive]}>{work.title}</Text>
                  </TouchableOpacity>
                );
              })}
              {selectedArtwork ? (
                <View style={styles.artworkDetailPanel}>
                  <Text style={styles.artworkDetailTitle}>{selectedArtwork.title}</Text>
                  <Text style={styles.artworkDetailMeta}>{selectedArtwork.year} • {selectedArtwork.medium}</Text>
                </View>
              ) : null}
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
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pageBtn: {
    borderWidth: 1,
    borderColor: '#ff4c4c',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pageBtnDisabled: {
    opacity: 0.35,
  },
  pageBtnText: {
    color: '#ff4c4c',
    fontSize: 12,
    fontWeight: '700',
  },
  pageText: {
    fontSize: 12,
    color: '#666',
  },
  grid:         { paddingHorizontal: 16, paddingBottom: 20 },
  row:          { justifyContent: 'space-between', marginBottom: 20 },
  card:         { width: CARD_WIDTH },
  cardSelected: { opacity: 0.85 },
  cardImage:    { width: '100%', height: 180, resizeMode: 'cover', backgroundColor: '#f0f0f0' },
  cardBody:     { paddingTop: 8 },
  cardName:     { fontSize: 13, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  cardDates:    { fontSize: 11, color: '#aaa', marginBottom: 1 },
  cardMedium:   { fontSize: 11, color: '#ff4c4c', fontWeight: '600' },
  cardAction: {
    marginTop: 6,
    fontSize: 11,
    color: '#333',
    textDecorationLine: 'underline',
  },
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
    color: '#444',
    fontSize: 12,
  },
  workItemBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ffd1d1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  workItemBtnActive: {
    borderColor: '#ff4c4c',
    backgroundColor: '#ffe9e9',
  },
  workItemActive: {
    color: '#c13030',
    fontWeight: '700',
  },
  artworkDetailPanel: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ffd1d1',
    paddingTop: 10,
  },
  artworkDetailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  artworkDetailMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
});

export default ArtistsScreen;

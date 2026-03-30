import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';

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

const formatWorkCount = (count) => `${count} ${count === 1 ? 'work' : 'works'}`;

const ArtistsScreen = () => {
  const { width: windowWidth } = useWindowDimensions();
  const isCompact = windowWidth < 380;
  const isWide = windowWidth >= 1024;
  const columns = isCompact ? 1 : isWide ? 3 : 2;
  const horizontalPadding = 32;
  const gutterWidth = (columns - 1) * 12;
  const cardWidth = (windowWidth - horizontalPadding - gutterWidth) / columns;
  const pageSize = columns * 2;

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedArtistId, setSelectedArtistId] = useState(ARTISTS[0]?.id || null);
  const [selectedArtworkId, setSelectedArtworkId] = useState(null);

  const totalPages = Math.ceil(ARTISTS.length / pageSize);

  const pagedArtists = useMemo(
    () => ARTISTS.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [currentPage, pageSize]
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
      style={[styles.card, { width: cardWidth }, selectedArtistId === item.id && styles.cardSelected]}
      onPress={() => setSelectedArtistId(item.id)}
      activeOpacity={0.86}
      accessibilityRole="button"
      accessibilityLabel={`Open artist ${item.name}`}
    >
      <Image source={{ uri: item.image }} style={[styles.cardImage, isCompact && styles.cardImageCompact]} />
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>{item.medium}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardDates}>{item.dates}</Text>
        <Text style={styles.cardBio} numberOfLines={isCompact ? 4 : 3}>{item.bio}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardMedium}>{formatWorkCount(item.works.length)}</Text>
          <Text style={styles.cardAction}>Open profile</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSection, isWide && styles.headerSectionWide]}>
        <Text style={[styles.headerTitle, isCompact && styles.headerTitleCompact]}>
          Artists &{'\n'}Artworks
        </Text>
        <Text style={styles.headerSub}>Works from the permanent collection</Text>
      </View>
      <View style={[styles.paginationBar, isWide && styles.paginationBarWide]}>
        <TouchableOpacity
          style={[styles.pageBtn, currentPage === 0 && styles.pageBtnDisabled]}
          disabled={currentPage === 0}
          onPress={() => setCurrentPage((page) => Math.max(0, page - 1))}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Go to previous artists page"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.pageBtnText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.pageText}>Page {currentPage + 1} / {totalPages}</Text>
        <TouchableOpacity
          style={[styles.pageBtn, currentPage >= totalPages - 1 && styles.pageBtnDisabled]}
          disabled={currentPage >= totalPages - 1}
          onPress={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Go to next artists page"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.pageBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        key={`artists-${columns}`}
        data={pagedArtists}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={columns}
        columnWrapperStyle={columns === 2 ? styles.row : undefined}
        contentContainerStyle={[styles.grid, isWide && styles.gridWide]}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          selectedArtist ? (
            <View style={styles.reviewPanel}>
              <Image source={{ uri: selectedArtist.image }} style={[styles.reviewImage, isWide && styles.reviewImageWide]} />
              <View style={styles.reviewHeaderRow}>
                <View style={styles.reviewHeaderMain}>
                  <Text style={styles.reviewTitle}>{selectedArtist.name}</Text>
                  <Text style={styles.reviewDates}>{selectedArtist.dates} • {selectedArtist.medium}</Text>
                </View>
                <View style={styles.reviewCountPill}>
                  <Text style={styles.reviewCountText}>{formatWorkCount(selectedArtist.works.length)}</Text>
                </View>
              </View>
              <Text style={styles.reviewBio}>{selectedArtist.bio}</Text>
              <View style={[styles.reviewStatsRow, isCompact && styles.reviewStatsRowCompact]}>
                <View style={[styles.reviewStatCard, isCompact && styles.reviewStatCardCompact]}>
                  <Text style={styles.reviewStatLabel}>Discipline</Text>
                  <Text style={styles.reviewStatValue}>{selectedArtist.medium}</Text>
                </View>
                <View style={[styles.reviewStatCard, isCompact && styles.reviewStatCardCompact]}>
                  <Text style={styles.reviewStatLabel}>Dates</Text>
                  <Text style={styles.reviewStatValue}>{selectedArtist.dates}</Text>
                </View>
              </View>
              <Text style={styles.workHeading}>Featured Artworks</Text>
              <View style={styles.workGrid}>
                {selectedArtist.works.map((work) => {
                  const active = selectedArtwork?.id === work.id;
                  const workButtonStyle = isCompact
                    ? styles.workItemBtnCompact
                    : isWide
                      ? styles.workItemBtnWide
                      : null;
                  return (
                    <TouchableOpacity
                      key={work.id}
                      onPress={() => setSelectedArtworkId(work.id)}
                      style={[styles.workItemBtn, workButtonStyle, active && styles.workItemBtnActive]}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Select artwork ${work.title}`}
                    >
                      <Text style={[styles.workItem, active && styles.workItemActive]} numberOfLines={2}>{work.title}</Text>
                      <Text style={[styles.workItemMeta, active && styles.workItemMetaActive]}>{work.year}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedArtwork ? (
                <View style={styles.artworkDetailPanel}>
                  <Text style={styles.artworkDetailEyebrow}>Selected artwork</Text>
                  <Text style={styles.artworkDetailTitle}>{selectedArtwork.title}</Text>
                  <Text style={styles.artworkDetailMeta}>{selectedArtwork.year} • {selectedArtwork.medium}</Text>
                  <Text style={styles.artworkDetailBody}>
                    Presented in the museum artist spotlight as a representative work for {selectedArtist.name}.
                  </Text>
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
  headerSectionWide: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  headerTitle:  { fontSize: 28, fontWeight: 'bold', color: '#000', lineHeight: 34, marginBottom: 6 },
  headerTitleCompact: { fontSize: 24, lineHeight: 30 },
  headerSub:    { fontSize: 13, color: '#aaa' },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  paginationBarWide: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
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
  gridWide: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  row:          { justifyContent: 'space-between', marginBottom: 20 },
  card: {
    borderRadius: 18,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#f0d9c7',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardSelected: {
    borderColor: '#d4824b',
    backgroundColor: '#fff7ef',
  },
  cardImage:    { width: '100%', height: 180, resizeMode: 'cover', backgroundColor: '#f0f0f0' },
  cardImageCompact: { height: 210 },
  cardBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(17, 17, 17, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cardBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody:     { padding: 12 },
  cardName:     { fontSize: 16, fontWeight: '700', color: '#161616', marginBottom: 4 },
  cardDates:    { fontSize: 11, color: '#8a6d58', marginBottom: 6 },
  cardBio: {
    fontSize: 12,
    color: '#51443a',
    lineHeight: 18,
    minHeight: 54,
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMedium:   { fontSize: 11, color: '#b2571c', fontWeight: '700' },
  cardAction: {
    fontSize: 11,
    color: '#2f3c4a',
    fontWeight: '700',
  },
  reviewPanel: {
    marginTop: 8,
    backgroundColor: '#fffaf3',
    borderWidth: 1,
    borderColor: '#f2dcc8',
    borderRadius: 20,
    padding: 16,
  },
  reviewImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: '#efe8e0',
  },
  reviewImageWide: {
    height: 300,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  reviewHeaderMain: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  reviewDates: {
    marginTop: 4,
    color: '#b2571c',
    fontWeight: '600',
    fontSize: 12,
  },
  reviewCountPill: {
    backgroundColor: '#f3e1d2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  reviewCountText: {
    color: '#7e4f2a',
    fontSize: 11,
    fontWeight: '700',
  },
  reviewBio: {
    marginTop: 8,
    color: '#444',
    lineHeight: 20,
    fontSize: 13,
  },
  reviewStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  reviewStatsRowCompact: {
    flexDirection: 'column',
  },
  reviewStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1ddcc',
  },
  reviewStatCardCompact: {
    flex: 0,
  },
  reviewStatLabel: {
    fontSize: 10,
    color: '#8e7968',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewStatValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#2a251f',
  },
  workHeading: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  workGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  workItem: {
    color: '#2a251f',
    fontSize: 12,
    fontWeight: '700',
  },
  workItemBtn: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ecd4be',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  workItemBtnCompact: {
    width: '100%',
  },
  workItemBtnWide: {
    width: '31.5%',
  },
  workItemBtnActive: {
    borderColor: '#d4824b',
    backgroundColor: '#fff1e3',
  },
  workItemActive: {
    color: '#8c4918',
    fontWeight: '700',
  },
  workItemMeta: {
    marginTop: 6,
    fontSize: 11,
    color: '#7f756d',
  },
  workItemMetaActive: {
    color: '#a05622',
  },
  artworkDetailPanel: {
    marginTop: 16,
    backgroundColor: '#1d1b19',
    borderRadius: 18,
    padding: 16,
  },
  artworkDetailEyebrow: {
    color: '#cba98d',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  artworkDetailTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff7eb',
  },
  artworkDetailMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#f0c6a8',
  },
  artworkDetailBody: {
    marginTop: 10,
    fontSize: 12,
    color: '#eadfd6',
    lineHeight: 18,
  },
});

export default ArtistsScreen;

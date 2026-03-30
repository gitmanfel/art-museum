import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { getExhibitions } from '../services/catalogue';

const formatDateRange = (start, end) => {
  if (!start && !end) return 'Dates to be announced';
  if (!start) return `Until ${end}`;
  if (!end) return `From ${start}`;
  return `${start} - ${end}`;
};

const ExhibitionScreen = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
  const slideWidth = width;
  const carouselWidth = isWide ? Math.min(width * 0.78, 920) : width * 0.85;

  const [search, setSearch] = useState('');
  const [artist, setArtist] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bioExpanded, setBioExpanded] = useState(false);

  const filters = useMemo(() => {
    const next = {};
    if (search.trim()) next.search = search.trim();
    if (artist.trim()) next.artist = artist.trim();
    return next;
  }, [search, artist]);

  useEffect(() => {
    let cancelled = false;

    const loadExhibitions = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getExhibitions(filters);
        if (cancelled) return;
        setExhibitions(data);
        setSelectedExhibition(data[0] || null);
        setActiveIndex(0);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Could not load exhibitions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadExhibitions();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const images = useMemo(() => {
    if (!selectedExhibition?.artworks?.length) return [];
    return selectedExhibition.artworks.map((art) => ({
      id: art.id,
      uri: art.image_url,
      caption: `"${art.title}"\n${art.medium || 'Artwork'}\n${art.year || ''}`,
    }));
  }, [selectedExhibition]);

  // Handle pagination dots update
  const onScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (activeIndex !== roundIndex) {
      setActiveIndex(roundIndex);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.searchWrap, isCompact && styles.searchWrapCompact, isWide && styles.sectionWide]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exhibitions"
          placeholderTextColor="#9e9e9e"
          value={search}
          onChangeText={setSearch}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by artist"
          placeholderTextColor="#9e9e9e"
          value={artist}
          onChangeText={setArtist}
        />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#ff4c4c" />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !selectedExhibition ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>No exhibitions found for this search.</Text>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabsRow, isWide && styles.sectionWide]}
          >
            {exhibitions.map((exh) => {
              const active = exh.id === selectedExhibition.id;
              return (
                <TouchableOpacity
                  key={exh.id}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => {
                    setSelectedExhibition(exh);
                    setActiveIndex(0);
                  }}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={`Open exhibition ${exh.name}`}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                    {exh.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.headerInfo, isCompact && styles.headerInfoCompact, isWide && styles.sectionWide]}>
            <View style={styles.headerBadgeRow}>
              <Text style={styles.categoryBadge}>EXHIBITION</Text>
              <Text style={styles.dateBadge}>{formatDateRange(selectedExhibition.start_date, selectedExhibition.end_date)}</Text>
            </View>
            <Text style={[styles.artistName, isCompact && styles.artistNameCompact]}>{selectedExhibition.name}</Text>
            <Text style={styles.dateText}>{selectedExhibition.artist || 'Curated group show'}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.floorPill}>Floor {selectedExhibition.location_floor || 'N/A'}</Text>
              <Text style={styles.floorText}>{images.length} artworks on view</Text>
            </View>
          </View>

          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
            >
              {images.map((img) => (
                <View key={img.id} style={[styles.slide, { width: slideWidth }]}>
                  <Image
                    source={{ uri: img.uri }}
                    style={[styles.carouselImage, { width: carouselWidth }, isCompact && styles.carouselImageCompact]}
                  />
                </View>
              ))}
            </ScrollView>
        
            <View style={styles.paginationContainer}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeIndex ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
        
            {images[activeIndex] ? (
              <View style={[styles.captionCard, isCompact && styles.captionCardCompact, isWide && styles.captionCardWide]}>
                <Text style={styles.captionText}>{images[activeIndex].caption}</Text>
              </View>
            ) : (
              <View style={[styles.captionCard, isCompact && styles.captionCardCompact, isWide && styles.captionCardWide]}>
                <Text style={styles.captionText}>No artworks available for this exhibition.</Text>
              </View>
            )}
          </View>

          <View style={[styles.bioSection, isWide && styles.sectionWide]}>
            <TouchableOpacity
              style={styles.bioHeaderRow}
              onPress={() => setBioExpanded(!bioExpanded)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={bioExpanded ? 'Hide exhibition description' : 'Show exhibition description'}
            >
              <Text style={styles.bioHeaderText}>DESCRIPTION</Text>
              <Text style={styles.chevronIcon}>{bioExpanded ? '^' : 'v'}</Text>
            </TouchableOpacity>
        
            {bioExpanded ? (
              <Text style={styles.bioBodyText}>
                {selectedExhibition.description || 'Description coming soon.'}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  searchWrapCompact: {
    paddingHorizontal: 14,
  },
  sectionWide: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222',
  },
  tabsRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
  },
  tabButton: {
    borderWidth: 1,
    borderColor: '#ffb3b3',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  tabButtonActive: {
    borderColor: '#ff4c4c',
    backgroundColor: '#ff4c4c',
  },
  tabText: {
    color: '#ff4c4c',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 220,
  },
  tabTextActive: {
    color: '#fff',
  },
  headerInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerInfoCompact: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#f4e5d8',
    color: '#914f1f',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateBadge: {
    backgroundColor: '#f0ece7',
    color: '#665b51',
    fontSize: 10,
    fontWeight: '600',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  artistName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#17120d',
    lineHeight: 34,
    marginBottom: 6,
  },
  artistNameCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  dateText: {
    fontSize: 14,
    color: '#8f4f1f',
    fontWeight: '700',
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  floorPill: {
    backgroundColor: '#1f1a14',
    color: '#f7e4cf',
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  floorText: {
    fontSize: 11,
    color: '#7d7268',
    fontWeight: '600',
  },
  carouselContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    height: 300,
    resizeMode: 'cover',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  carouselImageCompact: {
    height: 250,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#ff4c4c',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
  captionText: {
    textAlign: 'center',
    color: '#5f554d',
    fontSize: 12,
    lineHeight: 18,
  },
  captionCard: {
    marginTop: 10,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e8dccf',
    borderRadius: 14,
    backgroundColor: '#fcf8f4',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  captionCardCompact: {
    marginHorizontal: 14,
  },
  captionCardWide: {
    width: '100%',
    maxWidth: 720,
  },
  bioSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eadfcd',
    paddingTop: 16,
  },
  bioHeaderText: {
    fontSize: 13,
    color: '#745843',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  chevronIcon: {
    fontSize: 16,
    color: '#745843',
  },
  bioBodyText: {
    marginTop: 15,
    fontSize: 14,
    color: '#4f4740',
    lineHeight: 21,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#c13030',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#666',
  },
});

export default ExhibitionScreen;

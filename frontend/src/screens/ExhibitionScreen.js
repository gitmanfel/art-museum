import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getExhibitions } from '../services/catalogue';

const { width } = Dimensions.get('window');

const ExhibitionScreen = () => {
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
      <View style={styles.searchWrap}>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
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
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                    {exh.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.headerInfo}>
            <Text style={styles.categoryText}>EXHIBITION</Text>
            <Text style={styles.artistName}>{(selectedExhibition.artist || selectedExhibition.name).toUpperCase()}</Text>
            <Text style={styles.dateText}>{selectedExhibition.name}</Text>
            <Text style={styles.floorText}>FLOOR {selectedExhibition.location_floor || 'N/A'}</Text>
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
                <View key={img.id} style={styles.slide}>
                  <Image source={{ uri: img.uri }} style={styles.carouselImage} />
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
              <Text style={styles.captionText}>{images[activeIndex].caption}</Text>
            ) : (
              <Text style={styles.captionText}>No artworks available for this exhibition.</Text>
            )}
          </View>

          <View style={styles.bioSection}>
            <TouchableOpacity
              style={styles.bioHeaderRow}
              onPress={() => setBioExpanded(!bioExpanded)}
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
  categoryText: {
    fontSize: 10,
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  artistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 30,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#ff4c4c',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  floorText: {
    fontSize: 12,
    color: '#ccc',
  },
  carouselContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: width * 0.85,
    height: 300,
    resizeMode: 'cover',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
    color: '#aaa',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 10,
    paddingHorizontal: 40,
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
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  bioHeaderText: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 1,
  },
  chevronIcon: {
    fontSize: 18,
    color: '#888',
  },
  bioBodyText: {
    marginTop: 15,
    fontSize: 14,
    color: '#bbb',
    lineHeight: 22,
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

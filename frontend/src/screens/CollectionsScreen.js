import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { getCollection, getCollections } from '../services/catalogue';

const CATEGORY_OPTIONS = ['all', 'decorative-arts', 'paintings', 'photography', 'contemporary'];

const formatCategory = (value) => value.replace(/-/g, ' ');

const formatEra = (start, end) => {
  if (!start && !end) return 'Multi-period collection';
  if (!start) return `Until ${end}`;
  if (!end) return `From ${start}`;
  return `${start} - ${end}`;
};

const CollectionsScreen = () => {
  const { width: windowWidth } = useWindowDimensions();
  const isCompact = windowWidth < 380;
  const isWide = windowWidth >= 1024;
  const columns = isCompact ? 1 : isWide ? 3 : 2;
  const horizontalPadding = 30;
  const gutterWidth = (columns - 1) * 12;
  const cardWidth = (windowWidth - horizontalPadding - gutterWidth) / columns;

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedCollectionDetail, setSelectedCollectionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const filters = useMemo(() => {
    const next = {};
    const cleaned = search.trim();
    if (cleaned) next.search = cleaned;
    if (category !== 'all') next.category = category;
    return next;
  }, [search, category]);

  useEffect(() => {
    let cancelled = false;

    const loadCollections = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getCollections(filters);
        if (!cancelled) {
          setCollections(data);
          setSelectedCollection((current) => data.find((item) => item.id === current?.id) || data[0] || null);
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Unable to load collections.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCollections();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    const loadCollectionDetail = async () => {
      if (!selectedCollection?.id) {
        setSelectedCollectionDetail(null);
        return;
      }

      setDetailLoading(true);
      setDetailError('');

      try {
        const detail = await getCollection(selectedCollection.id);
        if (!cancelled) {
          setSelectedCollectionDetail(detail);
        }
      } catch (e) {
        if (!cancelled) {
          setSelectedCollectionDetail(selectedCollection);
          setDetailError(e.response?.data?.error || 'Unable to load collection artworks.');
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    loadCollectionDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedCollection]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.gridItem, { width: cardWidth }, selectedCollection?.id === item.id && styles.gridItemSelected]}
      onPress={() => setSelectedCollection(item)}
      activeOpacity={0.86}
      accessibilityRole="button"
      accessibilityLabel={`Open collection ${item.name}`}
    >
      <Image source={{ uri: item.image_url }} style={[styles.collectionImage, isCompact && styles.collectionImageCompact]} />
      <View style={styles.collectionBadgeRow}>
        <Text style={styles.collectionBadge}>{formatCategory(item.category || 'collection')}</Text>
        <Text style={styles.collectionEra}>{formatEra(item.era_start, item.era_end)}</Text>
      </View>
      <Text style={styles.collectionTitle}>{item.name}</Text>
      <Text style={styles.collectionDescription} numberOfLines={2}>
        {item.description || 'Explore highlights from this collection.'}
      </Text>
      <View style={styles.collectionFooter}>
        <Text style={styles.collectionAction}>Open collection</Text>
      </View>
    </TouchableOpacity>
  );

  const detail = selectedCollectionDetail || selectedCollection;
  const artworks = detail?.artworks || [];

  return (
    <View style={styles.container}>
      <View style={[styles.searchSection, isCompact && styles.searchSectionCompact, isWide && styles.sectionWide]}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Explore the Collection"
            placeholderTextColor="#ff4c4c"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          <Text style={styles.searchIcon}>Search</Text>
        </View>
        <TouchableOpacity
          onPress={() => setAdvancedOpen((prev) => !prev)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={advancedOpen ? 'Hide collection filters' : 'Show collection filters'}
        >
          <Text style={styles.advancedSearchText}>{advancedOpen ? 'Hide Filters' : 'Advanced Search'}</Text>
        </TouchableOpacity>
      </View>

      {advancedOpen ? (
        <View style={[styles.filtersRow, isWide && styles.sectionWide]}>
          {CATEGORY_OPTIONS.map((option) => {
            const active = category === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setCategory(option)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Filter collections by ${option === 'all' ? 'all categories' : option.replace('-', ' ')}`}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {option === 'all' ? 'All' : option.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#ff4c4c" />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          key={`collections-${columns}`}
          data={collections}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          contentContainerStyle={[styles.gridContainer, isWide && styles.sectionWide]}
          columnWrapperStyle={columns === 2 ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No collections match this filter.</Text>}
          ListFooterComponent={
            detail ? (
              <View style={styles.reviewPanel}>
                <Image source={{ uri: detail.image_url }} style={[styles.reviewImage, isWide && styles.reviewImageWide]} />
                <View style={styles.reviewBadgeRow}>
                  <Text style={styles.reviewBadge}>{formatCategory(detail.category || 'collection')}</Text>
                  <Text style={styles.reviewBadgeMuted}>{formatEra(detail.era_start, detail.era_end)}</Text>
                </View>
                <Text style={styles.reviewTitle}>{detail.name}</Text>
                <Text style={styles.reviewMeta}>
                  {artworks.length > 0 ? `${artworks.length} linked artworks` : 'Collection overview'}
                </Text>
                <Text style={styles.reviewBody}>
                  {detail.description || 'Explore highlights and related artworks in this collection.'}
                </Text>
                {detailLoading ? (
                  <View style={styles.detailState}>
                    <ActivityIndicator color="#d9732f" />
                  </View>
                ) : null}
                {detailError ? <Text style={styles.detailError}>{detailError}</Text> : null}
                {artworks.length > 0 ? (
                  <View style={styles.artworkSection}>
                    <Text style={styles.artworkSectionTitle}>Collection artworks</Text>
                    <View style={styles.artworkList}>
                      {artworks.slice(0, 4).map((artwork) => (
                      <View key={artwork.id} style={[styles.artworkCard, isWide && styles.artworkCardWide]}>
                        <Image source={{ uri: artwork.image_url }} style={styles.artworkImage} />
                        <View style={styles.artworkBody}>
                          <Text style={styles.artworkTitle}>{artwork.title}</Text>
                          <Text style={styles.artworkMeta}>{artwork.artist} • {artwork.year || 'date unknown'}</Text>
                          <Text style={styles.artworkDescription} numberOfLines={2}>
                            {artwork.medium || 'Museum collection object'}
                          </Text>
                        </View>
                      </View>
                    ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null
          }
        />
      )}
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
  searchSectionCompact: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  sectionWide: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
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
    fontSize: 12,
    color: '#ff4c4c',
    fontWeight: '700',
    letterSpacing: 0.4,
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
    width: '48%',
    borderRadius: 18,
    backgroundColor: '#fbfaf7',
    borderWidth: 1,
    borderColor: '#dfddd6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  gridItemSelected: {
    borderColor: '#d9732f',
    backgroundColor: '#fff7ef',
  },
  collectionImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  collectionImageCompact: {
    height: 200,
  },
  collectionBadgeRow: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  collectionBadge: {
    color: '#8f4715',
    backgroundColor: '#f7e7d8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  collectionEra: {
    fontSize: 10,
    color: '#75685c',
    flexShrink: 1,
    textAlign: 'right',
  },
  collectionTitle: {
    color: '#1b1b1b',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    marginTop: 10,
  },
  collectionDescription: {
    color: '#5e574f',
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 12,
    marginTop: 6,
    minHeight: 38,
  },
  collectionFooter: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  collectionAction: {
    color: '#27465a',
    fontSize: 11,
    fontWeight: '700',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#ffb3b3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: '#ff4c4c',
    backgroundColor: '#ff4c4c',
  },
  filterChipText: {
    color: '#ff4c4c',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#c13030',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 24,
  },
  reviewPanel: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ead6c4',
    borderRadius: 20,
    backgroundColor: '#fffaf4',
    padding: 16,
    marginBottom: 8,
  },
  reviewImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#f0ebe5',
    marginBottom: 14,
  },
  reviewImageWide: {
    height: 280,
  },
  reviewBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  reviewBadge: {
    color: '#8f4715',
    backgroundColor: '#f4e3d4',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reviewBadgeMuted: {
    color: '#6f655d',
    backgroundColor: '#f2ede8',
    fontSize: 10,
    fontWeight: '600',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reviewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  reviewMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#8f4715',
  },
  reviewBody: {
    marginTop: 8,
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
  },
  detailState: {
    marginTop: 14,
    alignItems: 'flex-start',
  },
  detailError: {
    marginTop: 10,
    color: '#b24122',
    fontSize: 12,
  },
  artworkSection: {
    marginTop: 18,
  },
  artworkList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  artworkSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#201d18',
    marginBottom: 10,
  },
  artworkCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efe0d1',
    overflow: 'hidden',
    marginBottom: 10,
  },
  artworkCardWide: {
    width: '49%',
  },
  artworkImage: {
    width: 92,
    height: 92,
    backgroundColor: '#ebe7e0',
  },
  artworkBody: {
    flex: 1,
    padding: 12,
  },
  artworkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1c18',
  },
  artworkMeta: {
    marginTop: 4,
    fontSize: 11,
    color: '#8c4719',
  },
  artworkDescription: {
    marginTop: 6,
    fontSize: 12,
    color: '#5d564f',
    lineHeight: 17,
  },
});

export default CollectionsScreen;

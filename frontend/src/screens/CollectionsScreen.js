import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getCollections } from '../services/catalogue';

const CATEGORY_OPTIONS = ['all', 'decorative-arts', 'paintings', 'photography', 'contemporary'];

const CollectionsScreen = () => {
  const [collections, setCollections] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        if (!cancelled) setCollections(data);
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

  const renderItem = ({ item }) => (
    <View style={styles.gridItem}>
      <Image source={{ uri: item.image_url }} style={styles.collectionImage} />
      <Text style={styles.collectionTitle}>{item.name.toUpperCase()}</Text>
      <Text style={styles.collectionDescription} numberOfLines={2}>
        {item.description || 'Explore highlights from this collection.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
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
        <TouchableOpacity onPress={() => setAdvancedOpen((prev) => !prev)}>
          <Text style={styles.advancedSearchText}>{advancedOpen ? 'Hide Filters' : 'Advanced Search'}</Text>
        </TouchableOpacity>
      </View>

      {advancedOpen ? (
        <View style={styles.filtersRow}>
          {CATEGORY_OPTIONS.map((option) => {
            const active = category === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setCategory(option)}
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
          data={collections}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No collections match this filter.</Text>}
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
  },
  collectionDescription: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
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
});

export default CollectionsScreen;

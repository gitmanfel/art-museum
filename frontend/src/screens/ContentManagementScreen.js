import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getCollections, getExhibitions } from '../services/catalogue';
import { createAdminCollection, createAdminExhibition } from '../services/admin';

const ContentManagementScreen = () => {
  const [collections, setCollections] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [collectionName, setCollectionName] = useState('');
  const [collectionCategory, setCollectionCategory] = useState('');
  const [exhibitionName, setExhibitionName] = useState('');
  const [exhibitionArtist, setExhibitionArtist] = useState('');

  const loadData = useCallback(async () => {
    const [collectionsData, exhibitionsData] = await Promise.all([
      getCollections(),
      getExhibitions(),
    ]);
    setCollections(collectionsData);
    setExhibitions(exhibitionsData);
  }, []);

  useEffect(() => {
    loadData().catch(() => {
      Alert.alert('Load failed', 'Unable to load content lists.');
    });
  }, [loadData]);

  const createCollection = async () => {
    if (!collectionName.trim()) {
      Alert.alert('Missing name', 'Collection name is required.');
      return;
    }

    try {
      await createAdminCollection({
        name: collectionName.trim(),
        category: collectionCategory.trim() || null,
      });
      setCollectionName('');
      setCollectionCategory('');
      await loadData();
      Alert.alert('Created', 'Collection created successfully.');
    } catch (e) {
      Alert.alert('Create failed', e.response?.data?.error || 'Could not create collection.');
    }
  };

  const createExhibition = async () => {
    if (!exhibitionName.trim()) {
      Alert.alert('Missing name', 'Exhibition name is required.');
      return;
    }

    try {
      await createAdminExhibition({
        name: exhibitionName.trim(),
        artist: exhibitionArtist.trim() || null,
      });
      setExhibitionName('');
      setExhibitionArtist('');
      await loadData();
      Alert.alert('Created', 'Exhibition created successfully.');
    } catch (e) {
      Alert.alert('Create failed', e.response?.data?.error || 'Could not create exhibition.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Content Manager</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Collection</Text>
        <TextInput
          style={styles.input}
          value={collectionName}
          onChangeText={setCollectionName}
          placeholder="Collection name"
          placeholderTextColor="#9b9b9b"
        />
        <TextInput
          style={styles.input}
          value={collectionCategory}
          onChangeText={setCollectionCategory}
          placeholder="Category (optional)"
          placeholderTextColor="#9b9b9b"
        />
        <TouchableOpacity style={styles.button} onPress={createCollection}>
          <Text style={styles.buttonText}>Add Collection</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Exhibition</Text>
        <TextInput
          style={styles.input}
          value={exhibitionName}
          onChangeText={setExhibitionName}
          placeholder="Exhibition name"
          placeholderTextColor="#9b9b9b"
        />
        <TextInput
          style={styles.input}
          value={exhibitionArtist}
          onChangeText={setExhibitionArtist}
          placeholder="Artist (optional)"
          placeholderTextColor="#9b9b9b"
        />
        <TouchableOpacity style={styles.button} onPress={createExhibition}>
          <Text style={styles.buttonText}>Add Exhibition</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Collections ({collections.length})</Text>
        {collections.slice(0, 8).map((item) => (
          <Text key={item.id} style={styles.listItem}>{item.name}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exhibitions ({exhibitions.length})</Text>
        {exhibitions.slice(0, 8).map((item) => (
          <Text key={item.id} style={styles.listItem}>{item.name}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 10,
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e3e3e3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    color: '#111',
  },
  button: {
    backgroundColor: '#ff4c4c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  listItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
});

export default ContentManagementScreen;

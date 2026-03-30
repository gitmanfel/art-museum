import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { getCollections, getExhibitions } from '../services/catalogue';
import {
  createAdminCollection,
  createAdminExhibition,
  updateAdminCollection,
  updateAdminExhibition,
  deleteAdminCollection,
  deleteAdminExhibition,
} from '../services/admin';

const ContentManagementScreen = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
  const [collections, setCollections] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);

  const [collectionName, setCollectionName] = useState('');
  const [collectionCategory, setCollectionCategory] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState(null);
  const [editingCollectionUpdatedAt, setEditingCollectionUpdatedAt] = useState(null);

  const [exhibitionName, setExhibitionName] = useState('');
  const [exhibitionArtist, setExhibitionArtist] = useState('');
  const [editingExhibitionId, setEditingExhibitionId] = useState(null);
  const [editingExhibitionUpdatedAt, setEditingExhibitionUpdatedAt] = useState(null);

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

  const resetCollectionForm = () => {
    setEditingCollectionId(null);
    setEditingCollectionUpdatedAt(null);
    setCollectionName('');
    setCollectionCategory('');
  };

  const resetExhibitionForm = () => {
    setEditingExhibitionId(null);
    setEditingExhibitionUpdatedAt(null);
    setExhibitionName('');
    setExhibitionArtist('');
  };

  const saveCollection = async () => {
    if (!collectionName.trim()) {
      Alert.alert('Missing name', 'Collection name is required.');
      return;
    }

    try {
      if (editingCollectionId) {
        await updateAdminCollection(editingCollectionId, {
          name: collectionName.trim(),
          category: collectionCategory.trim() || null,
          expectedUpdatedAt: editingCollectionUpdatedAt,
        });
        Alert.alert('Updated', 'Collection updated successfully.');
      } else {
        await createAdminCollection({
          name: collectionName.trim(),
          category: collectionCategory.trim() || null,
        });
        Alert.alert('Created', 'Collection created successfully.');
      }

      resetCollectionForm();
      await loadData();
    } catch (e) {
      Alert.alert('Save failed', e.response?.data?.error || 'Could not save collection.');
    }
  };

  const saveExhibition = async () => {
    if (!exhibitionName.trim()) {
      Alert.alert('Missing name', 'Exhibition name is required.');
      return;
    }

    try {
      if (editingExhibitionId) {
        await updateAdminExhibition(editingExhibitionId, {
          name: exhibitionName.trim(),
          artist: exhibitionArtist.trim() || null,
          expectedUpdatedAt: editingExhibitionUpdatedAt,
        });
        Alert.alert('Updated', 'Exhibition updated successfully.');
      } else {
        await createAdminExhibition({
          name: exhibitionName.trim(),
          artist: exhibitionArtist.trim() || null,
        });
        Alert.alert('Created', 'Exhibition created successfully.');
      }

      resetExhibitionForm();
      await loadData();
    } catch (e) {
      Alert.alert('Save failed', e.response?.data?.error || 'Could not save exhibition.');
    }
  };

  const removeCollection = (id) => {
    Alert.alert('Delete collection?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminCollection(id);
            if (editingCollectionId === id) resetCollectionForm();
            await loadData();
          } catch (e) {
            Alert.alert('Delete failed', e.response?.data?.error || 'Could not delete collection.');
          }
        },
      },
    ]);
  };

  const removeExhibition = (id) => {
    Alert.alert('Delete exhibition?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminExhibition(id);
            if (editingExhibitionId === id) resetExhibitionForm();
            await loadData();
          } catch (e) {
            Alert.alert('Delete failed', e.response?.data?.error || 'Could not delete exhibition.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.content, { paddingHorizontal: isCompact ? 14 : 20 }, isWide && styles.contentWide]}>
      <Text style={[styles.heading, { fontSize: isCompact ? 22 : isWide ? 32 : 26 }]}>Content Manager</Text>

      <View style={[styles.grid, isWide && styles.gridWide, { marginBottom: isCompact ? 14 : 16 }]}>
        <View style={[styles.card, styles.gridItem, isWide && styles.gridItemWide]}>
          <Text style={[styles.cardTitle, { fontSize: isCompact ? 16 : 18 }]}>{editingCollectionId ? 'Edit Collection' : 'Create Collection'}</Text>
          <TextInput
            style={[styles.input, { marginBottom: isCompact ? 10 : 12 }]}
            value={collectionName}
            onChangeText={setCollectionName}
            placeholder="Collection name"
            placeholderTextColor="#9b9b9b"
            accessibilityLabel="Collection name input"
            accessibilityHint="Enter the name of the collection"
          />
          <TextInput
            style={[styles.input, { marginBottom: isCompact ? 12 : 14 }]}
            value={collectionCategory}
            onChangeText={setCollectionCategory}
            placeholder="Category (optional)"
            placeholderTextColor="#9b9b9b"
            accessibilityLabel="Collection category input"
            accessibilityHint="Enter an optional category for this collection"
          />
          <TouchableOpacity style={[styles.button, { marginBottom: isCompact ? 10 : 12 }]} onPress={saveCollection} accessibilityRole="button" accessibilityLabel={editingCollectionId ? 'Save collection' : 'Add collection'}>
            <Text style={[styles.buttonText, { fontSize: isCompact ? 13 : 14 }]}>{editingCollectionId ? 'Save Collection' : 'Add Collection'}</Text>
          </TouchableOpacity>
          {editingCollectionId ? (
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetCollectionForm} accessibilityRole="button" accessibilityLabel="Cancel edit">
              <Text style={[styles.buttonText, styles.secondaryButtonText, { fontSize: isCompact ? 13 : 14 }]}>Cancel Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={[styles.card, styles.gridItem, isWide && styles.gridItemWide]}>
          <Text style={[styles.cardTitle, { fontSize: isCompact ? 16 : 18 }]}>{editingExhibitionId ? 'Edit Exhibition' : 'Create Exhibition'}</Text>
          <TextInput
            style={[styles.input, { marginBottom: isCompact ? 10 : 12 }]}
            value={exhibitionName}
            onChangeText={setExhibitionName}
            placeholder="Exhibition name"
            placeholderTextColor="#9b9b9b"
            accessibilityLabel="Exhibition name input"
            accessibilityHint="Enter the name of the exhibition"
          />
          <TextInput
            style={[styles.input, { marginBottom: isCompact ? 12 : 14 }]}
            value={exhibitionArtist}
            onChangeText={setExhibitionArtist}
            placeholder="Artist (optional)"
            placeholderTextColor="#9b9b9b"
            accessibilityLabel="Exhibition artist input"
            accessibilityHint="Enter an optional artist name"
          />
          <TouchableOpacity style={[styles.button, { marginBottom: isCompact ? 10 : 12 }]} onPress={saveExhibition} accessibilityRole="button" accessibilityLabel={editingExhibitionId ? 'Save exhibition' : 'Add exhibition'}>
            <Text style={[styles.buttonText, { fontSize: isCompact ? 13 : 14 }]}>{editingExhibitionId ? 'Save Exhibition' : 'Add Exhibition'}</Text>
          </TouchableOpacity>
          {editingExhibitionId ? (
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetExhibitionForm} accessibilityRole="button" accessibilityLabel="Cancel exhibition edit">
              <Text style={[styles.buttonText, styles.secondaryButtonText, { fontSize: isCompact ? 13 : 14 }]}>Cancel Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={[styles.grid, isWide && styles.gridWide]}>
        <View style={[styles.card, styles.gridItem, isWide && styles.gridItemWide]}>
          <Text style={styles.cardTitle}>Collections ({collections.length})</Text>
          {collections.slice(0, 8).map((item) => (
            <View key={item.id} style={styles.rowItem}>
              <Text style={styles.listItem}>{item.name}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  onPress={() => {
                    setEditingCollectionId(item.id);
                    setEditingCollectionUpdatedAt(item.updated_at || null);
                    setCollectionName(item.name || '');
                    setCollectionCategory(item.category || '');
                  }}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => removeCollection(item.id)}
                >
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card, styles.gridItem, isWide && styles.gridItemWide]}>
          <Text style={styles.cardTitle}>Exhibitions ({exhibitions.length})</Text>
          {exhibitions.slice(0, 8).map((item) => (
            <View key={item.id} style={styles.rowItem}>
              <Text style={styles.listItem}>{item.name}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  onPress={() => {
                    setEditingExhibitionId(item.id);
                    setEditingExhibitionUpdatedAt(item.updated_at || null);
                    setExhibitionName(item.name || '');
                    setExhibitionArtist(item.artist || '');
                  }}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => removeExhibition(item.id)}
                >
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    width: '100%',
    alignItems: 'stretch',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    padding: 16,
  },
  contentWide: {
    maxWidth: 1000,
  },
  grid: {
    width: '100%',
  },
  gridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
  },
  gridItemWide: {
    width: '49%',
    flex: 0,
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
  secondaryButton: {
    backgroundColor: '#f3f3f3',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#333',
  },
  rowItem: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnPrimary: {
    marginRight: 8,
  },
  actionText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    borderColor: '#ffb8b8',
  },
  deleteText: {
    color: '#b43030',
  },
});

export default ContentManagementScreen;

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
import {
  createAdminCollection,
  createAdminExhibition,
  updateAdminCollection,
  updateAdminExhibition,
  deleteAdminCollection,
  deleteAdminExhibition,
} from '../services/admin';

const ContentManagementScreen = () => {
  const [collections, setCollections] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);

  const [collectionName, setCollectionName] = useState('');
  const [collectionCategory, setCollectionCategory] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState(null);

  const [exhibitionName, setExhibitionName] = useState('');
  const [exhibitionArtist, setExhibitionArtist] = useState('');
  const [editingExhibitionId, setEditingExhibitionId] = useState(null);

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
    setCollectionName('');
    setCollectionCategory('');
  };

  const resetExhibitionForm = () => {
    setEditingExhibitionId(null);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Content Manager</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingCollectionId ? 'Edit Collection' : 'Create Collection'}</Text>
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
        <TouchableOpacity style={styles.button} onPress={saveCollection}>
          <Text style={styles.buttonText}>{editingCollectionId ? 'Save Collection' : 'Add Collection'}</Text>
        </TouchableOpacity>
        {editingCollectionId ? (
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetCollectionForm}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingExhibitionId ? 'Edit Exhibition' : 'Create Exhibition'}</Text>
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
        <TouchableOpacity style={styles.button} onPress={saveExhibition}>
          <Text style={styles.buttonText}>{editingExhibitionId ? 'Save Exhibition' : 'Add Exhibition'}</Text>
        </TouchableOpacity>
        {editingExhibitionId ? (
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetExhibitionForm}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Collections ({collections.length})</Text>
        {collections.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.rowItem}>
            <Text style={styles.listItem}>{item.name}</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setEditingCollectionId(item.id);
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exhibitions ({exhibitions.length})</Text>
        {exhibitions.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.rowItem}>
            <Text style={styles.listItem}>{item.name}</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setEditingExhibitionId(item.id);
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
    gap: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
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

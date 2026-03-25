import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

// Mock artwork images for Dorothea Lange exhibition (Image 4)
const IMAGES = [
  { id: '1', uri: 'https://images.unsplash.com/photo-1555620956-f64f895fbcd0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: '"Abandoned Dust Bowl Home"\nGelatin silver print\nabout 1935-1940' },
  { id: '2', uri: 'https://images.unsplash.com/photo-1544335448-f62d1c68fce1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: '"Migrant Mother"\nGelatin silver print\n1936' },
  { id: '3', uri: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: '"White Angel Breadline"\nGelatin silver print\n1933' },
];

const ExhibitionScreen = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [bioExpanded, setBioExpanded] = useState(false);

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
      <View style={styles.headerInfo}>
        <Text style={styles.categoryText}>RETROSPECTIVE</Text>
        <Text style={styles.artistName}>DOROTHEA{'\n'}LANGE</Text>
        <Text style={styles.dateText}>OCTOBER 15 - MARCH 18</Text>
        <Text style={styles.floorText}>FLOOR 3</Text>
      </View>

      {/* Image Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16} // smooth out the scroll event updates
        >
          {IMAGES.map((img) => (
            <View key={img.id} style={styles.slide}>
              <Image source={{ uri: img.uri }} style={styles.carouselImage} />
            </View>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {IMAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>

        {/* Caption for the active image */}
        <Text style={styles.captionText}>{IMAGES[activeIndex].caption}</Text>
      </View>

      {/* Expandable Biography Section */}
      <View style={styles.bioSection}>
        <TouchableOpacity
          style={styles.bioHeaderRow}
          onPress={() => setBioExpanded(!bioExpanded)}
        >
          <Text style={styles.bioHeaderText}>BIOGRAPHY</Text>
          <Text style={styles.chevronIcon}>{bioExpanded ? '∧' : '∨'}</Text>
        </TouchableOpacity>

        {bioExpanded && (
          <Text style={styles.bioBodyText}>
            Dorothea Lange (May 26, 1895 - October 11, 1965) was an influential American documentary photographer and photojournalist, best known for her Depression-era work for the Farm Security Administration (FSA). Lange's photographs humanized the consequences of the Great Depression and influenced the development of documentary photography.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 32,
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
  }
});

export default ExhibitionScreen;

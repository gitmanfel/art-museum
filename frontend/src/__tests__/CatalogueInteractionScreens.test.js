import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ArtistsScreen from '../screens/ArtistsScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import { getCollections } from '../services/catalogue';

jest.mock('../services/catalogue', () => ({
  getCollections: jest.fn(),
}));

describe('Catalogue interaction screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates artist review panel and artwork details when a different artist is selected', () => {
    const { getByText, getAllByText } = render(<ArtistsScreen />);

    expect(getAllByText('Dorothea Lange').length).toBeGreaterThan(0);
    fireEvent.press(getByText('Pablo Picasso'));

    expect(getByText('Co-founder of Cubism and one of the most influential artists of the 20th century.')).toBeTruthy();
    fireEvent.press(getByText("Les Demoiselles d'Avignon"));
    expect(getByText('1907 • Oil on canvas')).toBeTruthy();
  });

  it('paginates artists and shows second page content', () => {
    const { getByText, getAllByText, queryByText } = render(<ArtistsScreen />);

    expect(getByText('Page 1 / 2')).toBeTruthy();
    expect(queryByText('Dieter Rams')).toBeNull();

    fireEvent.press(getByText('Next'));

    expect(getByText('Page 2 / 2')).toBeTruthy();
    expect(getAllByText('Dieter Rams').length).toBeGreaterThan(0);
  });

  it('updates collection review panel when clicking another collection card', async () => {
    getCollections.mockResolvedValue([
      {
        id: 'coll-a',
        name: 'Decorative Arts',
        description: 'Furniture, ceramics and glass.',
        category: 'decorative-arts',
        era_start: 1700,
        era_end: 2000,
        image_url: 'https://example.com/a.jpg',
      },
      {
        id: 'coll-b',
        name: 'Landscape Photography',
        description: 'Nature scenes from global photographers.',
        category: 'photography',
        era_start: 1850,
        era_end: 2024,
        image_url: 'https://example.com/b.jpg',
      },
    ]);

    const { getByText } = render(<CollectionsScreen />);

    await waitFor(() => expect(getByText('DECORATIVE ARTS')).toBeTruthy());
    fireEvent.press(getByText('LANDSCAPE PHOTOGRAPHY'));

    await waitFor(() => expect(getByText('Landscape Photography')).toBeTruthy());
    expect(getByText('photography • 1850 - 2024')).toBeTruthy();
  });
});

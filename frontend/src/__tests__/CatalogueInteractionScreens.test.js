import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ArtistsScreen from '../screens/ArtistsScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import ExhibitionScreen from '../screens/ExhibitionScreen';
import { getCollection, getCollections, getExhibitions } from '../services/catalogue';

const originalConsoleError = console.error;

jest.mock('../services/catalogue', () => ({
  getCollection: jest.fn(),
  getCollections: jest.fn(),
  getExhibitions: jest.fn(),
}));

describe('Catalogue interaction screens', () => {
  let consoleErrorSpy;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const firstArg = typeof args[0] === 'string' ? args[0] : '';
      if (firstArg.includes('not wrapped in act')) {
        return;
      }
      originalConsoleError(...args);
    });
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getCollection.mockResolvedValue({
      id: 'coll-a',
      name: 'Decorative Arts',
      description: 'Furniture, ceramics and glass.',
      category: 'decorative-arts',
      era_start: 1700,
      era_end: 2000,
      image_url: 'https://example.com/a.jpg',
      artworks: [
        {
          id: 'art-1',
          title: 'Walnut Cabinet',
          artist: 'Unknown Maker',
          year: 1880,
          medium: 'Walnut and brass',
          image_url: 'https://example.com/art.jpg',
        },
      ],
    });
  });

  it('updates artist review panel and artwork details when a different artist is selected', () => {
    const { getByText, getAllByText, getByLabelText } = render(<ArtistsScreen />);

    expect(getAllByText('Dorothea Lange').length).toBeGreaterThan(0);
    fireEvent.press(getByLabelText('Open artist Pablo Picasso'));

    expect(getAllByText('Co-founder of Cubism and one of the most influential artists of the 20th century.').length).toBeGreaterThan(0);
    fireEvent.press(getByText("Les Demoiselles d'Avignon"));
    expect(getByText('1907 • Oil on canvas')).toBeTruthy();
  });

  it('paginates artists and shows second page content', () => {
    const { getByText, getAllByText, queryByText, getByLabelText } = render(<ArtistsScreen />);

    expect(getByText('Page 1 / 2')).toBeTruthy();
    expect(queryByText('Dieter Rams')).toBeNull();

    fireEvent.press(getByLabelText('Go to next artists page'));

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
    getCollection.mockResolvedValueOnce({
      id: 'coll-a',
      name: 'Decorative Arts',
      description: 'Furniture, ceramics and glass.',
      category: 'decorative-arts',
      era_start: 1700,
      era_end: 2000,
      image_url: 'https://example.com/a.jpg',
      artworks: [],
    }).mockResolvedValueOnce({
      id: 'coll-b',
      name: 'Landscape Photography',
      description: 'Nature scenes from global photographers.',
      category: 'photography',
      era_start: 1850,
      era_end: 2024,
      image_url: 'https://example.com/b.jpg',
      artworks: [
        {
          id: 'art-land-1',
          title: 'High Ridge',
          artist: 'A. Rivers',
          year: 1998,
          medium: 'Gelatin silver print',
          image_url: 'https://example.com/land.jpg',
        },
      ],
    });

    const { getByText, getByLabelText } = render(<CollectionsScreen />);

    await waitFor(() => expect(getByLabelText('Open collection Landscape Photography')).toBeTruthy());
    fireEvent.press(getByLabelText('Open collection Landscape Photography'));

    await waitFor(() => expect(getByText('Landscape Photography')).toBeTruthy());
    expect(getByText('1 linked artworks')).toBeTruthy();
    expect(getByText('High Ridge')).toBeTruthy();
  });

  it('toggles exhibition description and switches exhibition tabs', async () => {
    getExhibitions.mockResolvedValue([
      {
        id: 'exh-1',
        name: 'Light and Form',
        artist: 'Eva Stone',
        description: 'A study of sculpture and shadow.',
        start_date: '2026-03-01',
        end_date: '2026-08-30',
        location_floor: '2',
        artworks: [
          {
            id: 'art-1',
            title: 'Shadow Vessel',
            medium: 'Bronze',
            year: 2024,
            image_url: 'https://example.com/exh1.jpg',
          },
        ],
      },
      {
        id: 'exh-2',
        name: 'New City Rhythms',
        artist: 'Group Exhibition',
        description: 'An urban photography survey.',
        start_date: '2026-04-01',
        end_date: '2026-09-15',
        location_floor: '3',
        artworks: [],
      },
    ]);

    const { getByLabelText, getByText, getAllByText, queryByText } = render(<ExhibitionScreen />);

    await waitFor(() => expect(getByLabelText('Open exhibition New City Rhythms')).toBeTruthy());
    expect(queryByText('A study of sculpture and shadow.')).toBeNull();

    fireEvent.press(getByLabelText('Show exhibition description'));
    expect(getByText('A study of sculpture and shadow.')).toBeTruthy();

    fireEvent.press(getByLabelText('Open exhibition New City Rhythms'));
    await waitFor(() => expect(getAllByText('New City Rhythms').length).toBeGreaterThan(0));
    expect(getByText('No artworks available for this exhibition.')).toBeTruthy();
  });
});

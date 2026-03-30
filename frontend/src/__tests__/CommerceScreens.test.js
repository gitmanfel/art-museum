import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ShopScreen from '../screens/ShopScreen';
import TicketsScreen from '../screens/TicketsScreen';
import { useCart } from '../context/CartContext';
import { getProduct, getProducts, getTicketTypes } from '../services/catalogue';

jest.mock('../context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../services/catalogue', () => ({
  getProduct: jest.fn(),
  getProducts: jest.fn(),
  getTicketTypes: jest.fn(),
}));

describe('Commerce screens', () => {
  const navigate = jest.fn();
  const addItem = jest.fn().mockResolvedValue({ success: true });
  const navigation = {
    getParent: () => ({ navigate }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue({
      addItem,
      loading: false,
    });
  });

  it('loads product in ShopScreen from catalogue API', async () => {
    getProduct.mockResolvedValue({
      id: 'product-braun-watch',
      name: 'Braun Classic Watch',
      description: 'Watch description',
      price: 160,
      member_price: 140,
      images: ['https://example.com/watch.png'],
    });
    getProducts.mockResolvedValue([]);

    const { getByText } = render(<ShopScreen navigation={navigation} />);

    await waitFor(() => expect(getByText('Braun Classic Watch')).toBeTruthy());
    expect(getByText('$160.00')).toBeTruthy();
    expect(getByText('$140.00 Member Price')).toBeTruthy();
  });

  it('switches product details when clicking an item in More in Shop', async () => {
    getProduct
      .mockResolvedValueOnce({
        id: 'product-braun-watch',
        name: 'Braun Classic Watch',
        description: 'Watch description',
        price: 160,
        member_price: 140,
        stock_quantity: 12,
        images: ['https://example.com/watch.png'],
      })
      .mockResolvedValueOnce({
        id: 'product-mug',
        name: 'Ceramic Mug',
        description: 'Mug description',
        price: 24,
        member_price: 20,
        stock_quantity: 9,
        images: ['https://example.com/mug.png'],
      });

    getProducts.mockResolvedValue([
      { id: 'product-braun-watch', name: 'Braun Classic Watch', price: 160, image_url: 'https://example.com/watch.png' },
      { id: 'product-mug', name: 'Ceramic Mug', price: 24, image_url: 'https://example.com/mug.png' },
    ]);

    const { getByText, getAllByText } = render(<ShopScreen navigation={navigation} />);

    await waitFor(() => expect(getAllByText('Braun Classic Watch').length).toBeGreaterThan(0));
    fireEvent.press(getAllByText('Ceramic Mug')[0]);

    await waitFor(() => expect(getAllByText('Ceramic Mug').length).toBeGreaterThan(0));
    expect(getAllByText('$24.00').length).toBeGreaterThan(0);
  });

  it('loads ticket types and adds selected tickets to cart', async () => {
    getTicketTypes.mockResolvedValue([
      { id: 'ticket-adults', name: 'Adults', description: '', price: 8 },
      { id: 'ticket-seniors', name: 'Seniors', description: '65+ with ID', price: 5 },
    ]);

    const { getByText } = render(<TicketsScreen navigation={navigation} />);

    await waitFor(() => expect(getByText('Adults')).toBeTruthy());

    fireEvent.press(getByText('Continue to Payment'));

    await waitFor(() => {
      expect(useCart().addItem).toHaveBeenCalledWith({
        itemType: 'ticket',
        itemId: 'ticket-adults',
        quantity: 2,
      });
    });
  });
});

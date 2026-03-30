import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ShopScreen from '../screens/ShopScreen';
import TicketsScreen from '../screens/TicketsScreen';
import { useCart } from '../context/CartContext';
import { getProduct, getTicketTypes } from '../services/catalogue';

jest.mock('../context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../services/catalogue', () => ({
  getProduct: jest.fn(),
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

    const { getByText } = render(<ShopScreen navigation={navigation} />);

    await waitFor(() => expect(getByText('Braun Classic Watch')).toBeTruthy());
    expect(getByText('$160.00')).toBeTruthy();
    expect(getByText('$140.00 Member Price')).toBeTruthy();
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

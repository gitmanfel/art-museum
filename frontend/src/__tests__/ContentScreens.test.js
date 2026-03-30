import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MembershipScreen from '../screens/MembershipScreen';
import ContactScreen from '../screens/ContactScreen';
import OrdersScreen from '../screens/OrdersScreen';
import { useCart } from '../context/CartContext';
import { getMembershipTiers } from '../services/catalogue';
import { sendContactMessage, subscribeToMailingList } from '../services/contact';
import { getMyOrders } from '../services/checkout';

jest.mock('../context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../services/catalogue', () => ({
  getMembershipTiers: jest.fn(),
}));

jest.mock('../services/contact', () => ({
  sendContactMessage: jest.fn(),
  subscribeToMailingList: jest.fn(),
}));

jest.mock('../services/checkout', () => ({
  getMyOrders: jest.fn(),
}));

describe('Content screens', () => {
  const addItem = jest.fn().mockResolvedValue({ success: true });
  const navigate = jest.fn();
  const navigation = {
    getParent: () => ({ navigate }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue({ addItem, loading: false });
  });

  it('loads membership tiers and adds selected tier to cart', async () => {
    getMembershipTiers.mockResolvedValue([
      { id: 'membership-standard', name: 'Standard', price: 120, tax_deductible: 60 },
      { id: 'membership-premium', name: 'Premium', price: 220, tax_deductible: 120 },
    ]);

    const { getByText, getByLabelText } = render(<MembershipScreen navigation={navigation} />);

    await waitFor(() => expect(getByText('Standard - $120')).toBeTruthy());

    fireEvent.press(getByLabelText('Premium membership at 220 dollars'));
    fireEvent.press(getByLabelText('Join membership'));

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith({
        itemType: 'membership',
        itemId: 'membership-premium',
        quantity: 1,
      });
      expect(navigate).toHaveBeenCalledWith('Cart');
    });
  });

  it('submits contact message and mailing list subscription', async () => {
    sendContactMessage.mockResolvedValue({ message: 'Message sent' });
    subscribeToMailingList.mockResolvedValue({ message: 'Subscribed' });

    const { getByLabelText, getByText } = render(<ContactScreen />);

    fireEvent.changeText(getByLabelText('Contact full name input'), 'Ada Lovelace');
    fireEvent.changeText(getByLabelText('Contact email input'), 'ada@example.com');
    fireEvent.changeText(getByLabelText('Subject input'), 'Partnership');
    fireEvent.changeText(getByLabelText('Message input'), 'Interested in collaboration.');

    fireEvent.press(getByLabelText('Send message'));

    await waitFor(() => {
      expect(sendContactMessage).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        subject: 'Partnership',
        message: 'Interested in collaboration.',
      });
      expect(getByText('Message sent')).toBeTruthy();
    });

    fireEvent.changeText(getByLabelText('Newsletter email input'), 'newsletter@example.com');
    fireEvent.press(getByLabelText('Subscribe to mailing list'));

    await waitFor(() => {
      expect(subscribeToMailingList).toHaveBeenCalledWith({
        fullName: '',
        email: 'newsletter@example.com',
      });
      expect(getByText('Subscribed')).toBeTruthy();
    });
  });

  it('loads orders and refreshes list', async () => {
    getMyOrders
      .mockResolvedValueOnce([
        {
          id: 1,
          payment_intent_id: 'pi_123',
          amount_cents: 4200,
          currency: 'usd',
          provider: 'stripe',
          status: 'paid',
          created_at: 1735689600,
        },
      ])
      .mockResolvedValueOnce([]);

    const { getByText, getByLabelText } = render(<OrdersScreen />);

    await waitFor(() => expect(getByText('pi_123')).toBeTruthy());
    expect(getByText('USD 42.00')).toBeTruthy();

    fireEvent.press(getByLabelText('Refresh orders'));

    await waitFor(() => {
      expect(getMyOrders).toHaveBeenCalledTimes(2);
      expect(getByText('No orders yet')).toBeTruthy();
    });
  });
});

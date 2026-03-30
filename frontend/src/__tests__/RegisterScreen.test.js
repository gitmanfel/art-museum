import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import * as authService from '../services/auth';

jest.mock('../services/auth');

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.TouchableOpacity = ({ children, onPress, testID }) => (
    <RN.TouchableHighlight onPress={onPress} testID={testID}>
      {children}
    </RN.TouchableHighlight>
  );
  return RN;
});

describe('RegisterScreen UI & Logic', () => {
  const mockNavigation = { replace: jest.fn(), navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title, inputs, and create account button', () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />
    );

    expect(getByText('CREATE ACCOUNT')).toBeTruthy();
    expect(getByPlaceholderText('Email address')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm password')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('shows validation error for weak password', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Email address'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'weakpass');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'weakpass');

    await act(async () => {
      fireEvent.press(getByText('Create Account'));
    });

    await waitFor(() => {
      expect(
        getByText(
          'Password must be at least 10 characters and include uppercase, lowercase, number, and special character'
        )
      ).toBeTruthy();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('calls auth service and navigates on successful registration', async () => {
    authService.register.mockResolvedValue({ success: true, user: { email: 'user@example.com' } });

    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Email address'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'StrongPass1!');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'StrongPass1!');

    await act(async () => {
      fireEvent.press(getByText('Create Account'));
    });

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith('user@example.com', 'StrongPass1!');
      expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
    });
  });
});

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
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

describe('ResetPasswordScreen UI & Logic', () => {
  const mockNavigation = { navigate: jest.fn() };
  const mockRoute = { params: { token: 'prefilled-token' } };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders reset screen and pre-fills token from route params', () => {
    const { getByText, getByDisplayValue } = render(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('RESET PASSWORD')).toBeTruthy();
    expect(getByDisplayValue('prefilled-token')).toBeTruthy();
    expect(getByText('Reset Password')).toBeTruthy();
  });

  it('shows validation error for weak password', async () => {
    const { getByText, getByPlaceholderText } = render(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText('New password'), 'weakpass');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'weakpass');

    await act(async () => {
      fireEvent.press(getByText('Reset Password'));
    });

    await waitFor(() => {
      expect(
        getByText(
          'Password must be at least 10 characters and include uppercase, lowercase, number, and special character'
        )
      ).toBeTruthy();
    });

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('calls reset service and navigates to login on success', async () => {
    authService.resetPassword.mockResolvedValue({ success: true, message: 'Password reset successful' });

    const { getByText, getByPlaceholderText } = render(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText('New password'), 'StrongPass1!');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'StrongPass1!');

    await act(async () => {
      fireEvent.press(getByText('Reset Password'));
    });

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith('prefilled-token', 'StrongPass1!');
      expect(getByText('Password reset successful')).toBeTruthy();
    });

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });
});

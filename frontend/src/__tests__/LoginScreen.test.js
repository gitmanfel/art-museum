import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import * as authService from '../services/auth';

jest.mock('../services/auth');

// Mock TouchableOpacity to bypass deep Animated internals causing React test renderer mismatch
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.TouchableOpacity = ({ children, onPress, testID }) => (
    <RN.TouchableHighlight onPress={onPress} testID={testID}>
      {children}
    </RN.TouchableHighlight>
  );
  return RN;
});

describe('LoginScreen UI & Logic', () => {
  const mockNavigation = { replace: jest.fn(), navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title, inputs, and login button correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    
    expect(getByText('YOUR ART MUSEUM')).toBeTruthy();
    expect(getByPlaceholderText('Email address')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Log In')).toBeTruthy();
  });

  it('shows an error message when fields are empty on submit', async () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    await act(async () => {
        fireEvent.press(getByText('Log In'));
    });
    
    await waitFor(() => {
        expect(getByText('Please enter both email and password.')).toBeTruthy();
    });
    
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('calls auth service and navigates on successful login', async () => {
    authService.login.mockResolvedValue({ success: true, user: { email: 'test@example.com' } });
    
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(getByPlaceholderText('Email address'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    
    await act(async () => {
        fireEvent.press(getByText('Log In'));
    });
    
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
    });
  });

  it('shows an error message on failed login attempt', async () => {
    authService.login.mockResolvedValue({ success: false, error: 'Invalid credentials' });
    
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(getByPlaceholderText('Email address'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    
    await act(async () => {
        fireEvent.press(getByText('Log In'));
    });
    
    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
      expect(mockNavigation.replace).not.toHaveBeenCalled();
    });
  });

  it('shows an error when forgot-password is pressed without email', async () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    await act(async () => {
      fireEvent.press(getByText('Forgot your password?'));
    });

    await waitFor(() => {
      expect(getByText('Please enter your email first.')).toBeTruthy();
    });

    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('navigates to reset-password screen when forgot-password returns a token', async () => {
    authService.forgotPassword.mockResolvedValue({
      success: true,
      message: 'If an account exists for this email, a reset link has been sent.',
      resetToken: 'dev-reset-token',
    });

    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByPlaceholderText('Email address'), 'test@example.com');

    await act(async () => {
      fireEvent.press(getByText('Forgot your password?'));
    });

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ResetPassword', {
        email: 'test@example.com',
        token: 'dev-reset-token',
      });
    });
  });
});

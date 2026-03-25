import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';

describe('HomeScreen Component', () => {
  it('renders correctly with static data from the prototype', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('MASTERS\nOLD AND\nNEW')).toBeTruthy();
    expect(getByText('APRIL 15 - SEPTEMBER 20')).toBeTruthy();
    expect(getByText('Plan Your Visit')).toBeTruthy();

    // Check for footer info
    expect(getByText('151 3rd St')).toBeTruthy();
    expect(getByText('San Francisco, CA 94103')).toBeTruthy();
    expect(getByText('Open today')).toBeTruthy();
    expect(getByText('10:00am — 5:30pm')).toBeTruthy();
  });
});

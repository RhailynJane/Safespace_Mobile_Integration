import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import ResourcesScreen from '../../app/(app)/resources/index';

describe('ResourcesScreen', () => {
  // Convex-shaped mock resources
  const mockResources = [
    {
      id: '1',
      title: 'Managing Stress',
      type: 'Article',
      duration: '5 min',
      category: 'stress',
      content: 'Tips for managing daily stress',
      author: 'Team',
      image_emoji: '💧',
      backgroundColor: '#FFE0B2',
    },
    {
      id: '2',
      title: 'Anxiety Techniques',
      type: 'Guide',
      duration: '7 min',
      category: 'anxiety',
      content: 'Breathing exercises for anxiety',
      author: 'Coach',
      image_emoji: '🧠',
      backgroundColor: '#C8E6C9',
    },
    {
      id: '3',
      title: 'Sleep Better',
      type: 'Article',
      duration: '6 min',
      category: 'sleep',
      content: 'How to improve your sleep',
      author: 'Expert',
      image_emoji: '🛏️',
      backgroundColor: '#B3E5FC',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders resources screen correctly', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Resources')).toBeTruthy();
    });
  });

  it('displays category filters', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Stress')).toBeTruthy();
    });
    
    expect(screen.getByText('Anxiety')).toBeTruthy();
    expect(screen.getByText('Depression')).toBeTruthy();
    expect(screen.getByText('Sleep')).toBeTruthy();
    expect(screen.getByText('Motivation')).toBeTruthy();
    expect(screen.getByText('Mindfulness')).toBeTruthy();
  });

  it('displays quick action buttons', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText(/Daily Affirmation/i)).toBeTruthy();
    });
    
    expect(screen.getByText(/Random Quote/i)).toBeTruthy();
  });

  it('displays search bar', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search resources/i)).toBeTruthy();
    });
  });
});

// File: components/BottomNavigation.tsx

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../constants/theme';

type NavItem = 'home' | 'appointments' | 'messages' | 'profile';

interface BottomNavigationProps {
  activeTab?: NavItem;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab = 'home' }) => {
  const handleNavPress = (tab: NavItem) => {
    switch (tab) {
      case 'home':
        router.push('/(app)');
        break;
      case 'appointments':
        // TODO: Implement appointments navigation
        console.log('Appointments pressed');
        break;
      case 'messages':
        // TODO: Implement messages navigation
        console.log('Messages pressed');
        break;
      case 'profile':
        // TODO: Implement profile navigation
        console.log('Profile pressed');
        break;
    }
  };

  const renderNavItem = (
    tab: NavItem,
    iconName: string,
    label: string
  ) => {
    const isActive = activeTab === tab;
    
    return (
      <TouchableOpacity
        key={tab}
        style={styles.navItem}
        onPress={() => handleNavPress(tab)}
      >
        <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
          <Ionicons
            name={iconName as any}
            size={24}
            color={isActive ? Colors.primary : Colors.textSecondary}
          />
        </View>
        <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {renderNavItem('home', 'home', 'Home')}
        {renderNavItem('appointments', 'calendar', 'Book Appointments')}
        {renderNavItem('messages', 'chatbubble', 'Messages')}
        {renderNavItem('profile', 'person', 'Profile')}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceSecondary,
  },
  navBar: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl, // Extra padding for safe area
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 4,
  },
  activeIconContainer: {
    // Could add background or other active styling here
  },
  navLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeNavLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default BottomNavigation;
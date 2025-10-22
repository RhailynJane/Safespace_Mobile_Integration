import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  border: string;
  borderLight: string;
  icon: string;
  iconDisabled: string;
  primary: string;
  accent: string;
  error: string;
}

interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

const lightTheme: ThemeColors = {
  background: "#F5F5F5",
  surface: "#FFFFFF",
  text: "#333",
  textSecondary: "#666",
  textDisabled: "#999",
  border: "#E0E0E0",
  borderLight: "#F0F0F0",
  icon: "#666",
  iconDisabled: "#999",
  primary: "#4CAF50",
  accent: "#7FDBDA",
  error: "#FF6B6B",
};

const darkTheme: ThemeColors = {
  background: "#121212",
  surface: "#1E1E1E",
  text: "#FFFFFF",
  textSecondary: "#B3B3B3",
  textDisabled: "#666",
  border: "#333",
  borderLight: "#2A2A2A",
  icon: "#B3B3B3",
  iconDisabled: "#666",
  primary: "#4CAF50",
  accent: "#7FDBDA",
  error: "#FF6B6B",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('appDarkMode', JSON.stringify(value));
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    saveThemePreference(newValue);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    saveThemePreference(value);
  };

  const theme: Theme = {
    colors: isDarkMode ? darkTheme : lightTheme,
    isDark: isDarkMode,
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

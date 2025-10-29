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
  textSize: string;
  setTextSize: (size: string) => void;
  fontScale: number;
  scaledFontSize: (baseSize: number) => number;
}

const lightTheme: ThemeColors = {
  background: "#E8E8E8",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#555",
  textDisabled: "#999",
  border: "#D0D0D0",
  borderLight: "#E5E5E5",
  icon: "#555",
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

// Helper function to get font scale based on text size
const getScaleForTextSize = (size: string): number => {
  switch (size) {
    case "Extra Small":
      return 0.85;
    case "Small":
      return 0.95;
    case "Medium":
      return 1.0;
    case "Large":
      return 1.15;
    default:
      return 1.0;
  }
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [textSize, setTextSizeState] = useState<string>('Medium');
  const [fontScale, setFontScale] = useState<number>(1.0);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appDarkMode');
      console.log('📱 Loading theme preference from AsyncStorage:', savedTheme);
      if (savedTheme !== null) {
        const isDark = JSON.parse(savedTheme);
        setIsDarkMode(isDark);
        console.log('📱 Theme loaded and applied:', isDark ? 'Dark' : 'Light');
      }

      // Load text size preference
      const savedTextSize = await AsyncStorage.getItem('appTextSize');
      if (savedTextSize !== null) {
        setTextSizeState(savedTextSize);
        const scale = getScaleForTextSize(savedTextSize);
        setFontScale(scale);
        console.log('📱 Text size loaded:', savedTextSize, 'Scale:', scale);
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveThemePreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('appDarkMode', JSON.stringify(value));
      console.log('📱 Theme preference saved to AsyncStorage:', value ? 'Dark' : 'Light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    console.log('📱 Toggling dark mode:', newValue ? 'Dark' : 'Light');
    setIsDarkMode(newValue);
    saveThemePreference(newValue);
  };

  const setDarkMode = (value: boolean) => {
    console.log('📱 Setting dark mode:', value ? 'Dark' : 'Light');
    setIsDarkMode(value);
    saveThemePreference(value);
  };

  const setTextSize = async (size: string) => {
    console.log('📱 Setting text size:', size);
    setTextSizeState(size);
    const scale = getScaleForTextSize(size);
    setFontScale(scale);
    
    try {
      await AsyncStorage.setItem('appTextSize', size);
      console.log('📱 Text size preference saved:', size);
    } catch (error) {
      console.log('Error saving text size preference:', error);
    }
  };

  const scaledFontSize = (baseSize: number): number => {
    return Math.round(baseSize * fontScale);
  };

  const theme: Theme = {
    colors: isDarkMode ? darkTheme : lightTheme,
    isDark: isDarkMode,
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDarkMode, 
      toggleDarkMode, 
      setDarkMode,
      textSize,
      setTextSize,
      fontScale,
      scaledFontSize
    }}>
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

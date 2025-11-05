/* eslint-disable react/prop-types */
import React, { useState, memo } from 'react';
import { ActivityIndicator, View, StyleSheet, StyleProp, ImageStyle, Image as RNImage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CacheMode = 'default' | 'reload' | 'force-cache' | 'only-if-cached';
type ContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

interface OptimizedImageProps {
  source: { uri?: string } | number;
  style?: StyleProp<ImageStyle>;
  loaderColor?: string;
  loaderSize?: 'small' | 'large';
  showErrorIcon?: boolean;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  cache?: CacheMode;
  contentFit?: ContentFit;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
  /**
   * Milliseconds for fade-in transition once image is loaded (expo-image)
   */
  transition?: number;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  /**
   * TestID passthrough
   */
  testID?: string;
}

/**
 * OptimizedImage component with built-in loading states, error handling, and caching
 * 
 * Features:
 * - Automatic loading indicator
 * - Error state with fallback icon
 * - Image caching configuration
 * - Memoized to prevent unnecessary re-renders
 * 
 * @example
 * <OptimizedImage
 *   source={{ uri: imageUrl }}
 *   style={styles.image}
 *   resizeMode="cover"
 *   loaderColor="#2196F3"
 * />
 */
const OptimizedImage: React.FC<OptimizedImageProps> = memo((props) => {
  const {
    source,
    style,
    loaderColor = '#2196F3',
    loaderSize = 'small',
    showErrorIcon = true,
    fallbackIcon = 'image-outline',
    cache = 'force-cache',
    contentFit,
    transition = 150,
    accessibilityLabel,
    testID,
  } = props;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Try to load expo-image at runtime; gracefully fall back to RN Image if not installed
  let ExpoImageImpl: any = null;
  try {
    ExpoImageImpl = require('expo-image').Image;
  } catch (_e) {
    ExpoImageImpl = null;
  }

  // Extract dimensions from style for centered loader/error
  const flatStyle = StyleSheet.flatten(style);
  const width = flatStyle?.width;
  const height = flatStyle?.height;

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (e: any) => {
    console.log('Image load error:', e.nativeEvent?.error);
    setLoading(false);
    setError(true);
  };

  // Map legacy Image cache prop to expo-image cachePolicy
  const mapCachePolicy = (c: CacheMode | undefined): 'none' | 'disk' | 'memory-disk' => {
    switch (c) {
      case 'reload':
        return 'none';
      case 'force-cache':
        return 'memory-disk';
      case 'only-if-cached':
        return 'disk';
      case 'default':
      default:
        return 'disk';
    }
  };

  const expoCachePolicy = mapCachePolicy(cache);
  const mapResizeMode = (rm?: OptimizedImageProps['resizeMode']): ContentFit => {
    switch (rm) {
      case 'contain':
        return 'contain';
      case 'cover':
        return 'cover';
      case 'stretch':
        return 'fill';
      case 'center':
        return 'none';
      case 'repeat':
        return 'cover';
      default:
        return 'cover';
    }
  };

  // For local images (require), still use expo-image (supports numbers)
  if (typeof source === 'number') {
    if (ExpoImageImpl) {
      return (
        <ExpoImageImpl
          source={source}
          style={style as any}
          contentFit={contentFit ?? mapResizeMode((props as any).resizeMode)}
          cachePolicy={expoCachePolicy}
          transition={transition}
          accessibilityLabel={accessibilityLabel}
          testID={testID ?? 'optimized-image'}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      );
    }
    return (
      <RNImage
        source={source}
        style={style as any}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        accessibilityLabel={accessibilityLabel}
        testID={testID ?? 'optimized-image'}
      />
    );
  }

  // If no URI provided, show error state
  if (!source.uri) {
    return (
      <View style={[styles.container, style, styles.centerContent]}>
        {showErrorIcon && (
          <Ionicons name={fallbackIcon} size={32} color="#999" />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }] }>
      {ExpoImageImpl ? (
        <ExpoImageImpl
          source={source.uri!}
          style={style as any}
          contentFit={contentFit ?? mapResizeMode((props as any).resizeMode)}
          cachePolicy={expoCachePolicy}
          transition={transition}
          accessibilityLabel={accessibilityLabel}
          testID={testID ?? 'optimized-image'}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      ) : (
        <RNImage
          source={{ uri: source.uri!, cache: cache as any }}
          style={style as any}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          accessibilityLabel={accessibilityLabel}
          testID={testID ?? 'optimized-image'}
        />
      )}
      
      {loading && !error && (
        <View testID="image-loading-indicator" style={[styles.overlay, styles.centerContent]}>
          <ActivityIndicator size={loaderSize} color={loaderColor} />
        </View>
      )}
      
      {error && showErrorIcon && (
        <View testID="image-error-placeholder" style={[styles.overlay, styles.centerContent, styles.errorContainer]}>
          <Ionicons name={fallbackIcon} size={32} color="#999" />
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FAFAFA',
  },
});

export default OptimizedImage;

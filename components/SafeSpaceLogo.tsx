// File: components/SafeSpaceLogo.tsx
import React from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";

type SafeSpaceLogoProps = {
  size?: number; // Logo dimensions in pixels (default: 60)
  width?: number; // Optional specific width (overrides size)
  height?: number; // Optional specific height (overrides size)
  tintColor?: string; // Optional color to tint the logo
  style?: object; // Additional style overrides
};

/**
 * SafeSpaceLogo - Enhanced logo component with precise size control
 * Displays the SafeSpace logo with flexible sizing options
 */
const SafeSpaceLogo: React.FC<SafeSpaceLogoProps> = ({
  size = 300,
  width,
  height,
  tintColor,
  style,
}) => {
  const logoImage: ImageSourcePropType = require("../assets/images/safespace-logo.png");

  // Calculate final dimensions
  const finalWidth = width ?? size;
  const finalHeight = height ?? size;

  const logoStyles = StyleSheet.create({
    container: {
      width: finalWidth,
      height: finalHeight,
      alignItems: "center",
      justifyContent: "center",
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
      tintColor: tintColor,
    },
  });

  return (
    <View style={[logoStyles.container, style]}>
      <Image
        source={logoImage}
        style={logoStyles.image}
        accessibilityLabel="SafeSpace logo"
      />
    </View>
  );
};

export default SafeSpaceLogo;

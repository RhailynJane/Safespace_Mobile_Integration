// File: components/SafeSpaceLogo.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

// Props interface for the SafeSpaceLogo component
type SafeSpaceLogoProps = {
  size?: number; // Optional size prop to control logo dimensions (default: 60)
};

/**
 * SafeSpaceLogo - Custom logo component for the SafeSpace app
 * Creates a heart-shaped logo using two rotated rounded squares
 * The logo is scalable and uses brand colors from the theme
 */
const SafeSpaceLogo: React.FC<SafeSpaceLogoProps> = ({ size = 60 }) => {
  // Dynamic styles based on the size prop
  // Using StyleSheet.create inside component to access the size variable
  const logoStyles = StyleSheet.create({
    // Main container that defines the overall logo dimensions
    container: {
      width: size,
      height: size,
      position: "relative", // Allows absolute positioning of child elements
    },

    // Left half of the heart shape
    heartLeft: {
      position: "absolute",
      width: size / 2, // Half the container width
      height: size / 2, // Half the container height
      backgroundColor: Colors.primary, // Primary brand color
      borderRadius: size / 4, // Rounded corners (quarter of width for nice curves)
      top: 0,
      left: 0,
      transform: [{ rotate: "-45deg" }], // Rotate counter-clockwise to form left heart curve
    },

    // Right half of the heart shape
    heartRight: {
      position: "absolute",
      width: size / 2,
      height: size / 2,
      backgroundColor: Colors.secondary, // Secondary brand color for contrast
      borderRadius: size / 4,
      top: 0,
      right: 0,
      transform: [{ rotate: "45deg" }], // Rotate clockwise to form right heart curve
    },
  });

  return (
    <View style={logoStyles.container}>
      {/* Left heart element */}
      <View style={logoStyles.heartLeft} />
      {/* Right heart element */}
      <View style={logoStyles.heartRight} />
    </View>
  );
};

export default SafeSpaceLogo;

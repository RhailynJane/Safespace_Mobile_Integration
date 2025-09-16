import React from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface CurvedBackgroundProps {
  children?: React.ReactNode;
  style?: object;
}

/**LLM Prompt: 
 * I need a React Native component that creates an elegant background with flowing curves and gradient colors using SVG. 
 * It should use responsive SVG paths with customizable gradients, accept children elements, and have TypeScript props.
 * Reference: chat.deepseek
 */

/**
 * CurvedBackground Component
 * 
 * A reusable React Native component that creates a visually appealing background
 * with flowing curved shapes and gradient colors. Perfect for login screens,
 * onboarding flows, or any UI that needs an elegant background.
 * 
 * Props:
 * - children: React nodes to render on top of the background
 * - style: Additional styles to apply to the container
 */
const CurvedBackground: React.FC<CurvedBackgroundProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Svg
        width={screenWidth}
        height={screenHeight}
        viewBox={`0 0 ${screenWidth} ${screenHeight}`}
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          {/* First gradient - diagonal light gray to medium gray */}
          <LinearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#f8f9fa" stopOpacity="0.5" />
            <Stop offset="50%" stopColor="#e9ecef" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#dee2e6" stopOpacity="0.4" />
          </LinearGradient>
          
          {/* Second gradient - bottom to top with lighter colors */}
          <LinearGradient id="gradient2" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#f1f3f4" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
          </LinearGradient>
          
          {/* Third gradient - reverse diagonal with subtle grays */}
          <LinearGradient id="gradient3" x1="100%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#e9ecef" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#dee2e6" stopOpacity="0.2" />
          </LinearGradient>
        </Defs>

        {/* Main flowing curve - creates the primary visual element */}
        <Path
          d={`M 0 ${screenHeight * 0.3} 
              Q ${screenWidth * 0.3} ${screenHeight * 0.1} 
                ${screenWidth * 0.7} ${screenHeight * 0.4}
              Q ${screenWidth * 0.9} ${screenHeight * 0.6} 
                ${screenWidth} ${screenHeight * 0.2}
              L ${screenWidth} ${screenHeight}
              L 0 ${screenHeight} Z`}
          fill="url(#gradient1)"
        />

        {/* Middle curve - adds depth and dimension */}
        <Path
          d={`M 0 ${screenHeight * 0.55}
              Q ${screenWidth * 0.25} ${screenHeight * 0.45}
                ${screenWidth * 0.5} ${screenHeight * 0.6}
              Q ${screenWidth * 0.75} ${screenHeight * 0.75}
                ${screenWidth} ${screenHeight * 0.65}
              L ${screenWidth} ${screenHeight}
              L 0 ${screenHeight} Z`}
          fill="url(#gradient2)"
          opacity="0.85"
        />

        {/* Lower curve - grounds the design at the bottom */}
        <Path
          d={`M 0 ${screenHeight * 0.8}
              Q ${screenWidth * 0.2} ${screenHeight * 0.7}
                ${screenWidth * 0.4} ${screenHeight * 0.85}
              Q ${screenWidth * 0.6} ${screenHeight * 0.95}
                ${screenWidth} ${screenHeight * 0.9}
              L ${screenWidth} ${screenHeight}
              L 0 ${screenHeight} Z`}
          fill="url(#gradient2)"
        />
      </Svg>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#dee2e6",
  },
});

export default CurvedBackground;


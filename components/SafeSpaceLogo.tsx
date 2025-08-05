// File: components/SafeSpaceLogo.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

type SafeSpaceLogoProps = {
  size?: number;
};

const SafeSpaceLogo: React.FC<SafeSpaceLogoProps> = ({ size = 60 }) => {
  const logoStyles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      position: "relative",
    },
    heartLeft: {
      position: "absolute",
      width: size / 2,
      height: size / 2,
      backgroundColor: Colors.primary,
      borderRadius: size / 4,
      top: 0,
      left: 0,
      transform: [{ rotate: "-45deg" }],
    },
    heartRight: {
      position: "absolute",
      width: size / 2,
      height: size / 2,
      backgroundColor: Colors.secondary,
      borderRadius: size / 4,
      top: 0,
      right: 0,
      transform: [{ rotate: "45deg" }],
    },
  });

  return (
    <View style={logoStyles.container}>
      <View style={logoStyles.heartLeft} />
      <View style={logoStyles.heartRight} />
    </View>
  );
};

export default SafeSpaceLogo;

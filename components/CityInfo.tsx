// File: components/CityInfo.tsx

import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

// Define the type for the component's props
type CityInfoProps = {
  info: string;
};

export default function CityInfo({ info }: CityInfoProps) {
  return (
    <View style={styles.infoContainer}>
      <Text style={styles.infoText}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
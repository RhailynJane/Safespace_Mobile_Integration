// File: components/CityLink.tsx

import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import * as Linking from 'expo-linking';

// Define the type for the component's props
type CityLinkProps = {
  url: string;
};

export default function CityLink({ url }: CityLinkProps) {
  return (
    <Pressable onPress={() => Linking.openURL(url)}>
      <Text style={styles.linkText}>Go to city page</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linkText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF', // A standard blue link color
    textDecorationLine: 'underline',
  },
});
import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#7BB8A8',
  },
});

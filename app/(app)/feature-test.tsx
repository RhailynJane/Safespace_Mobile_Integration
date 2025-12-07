import { View, StyleSheet } from 'react-native';
import FeatureAccessTest from '../../components/FeatureAccessTest';

export default function FeatureTestScreen() {
  return (
    <View style={styles.container}>
      <FeatureAccessTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

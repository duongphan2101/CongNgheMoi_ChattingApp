import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';

export default function App({navigation}) {
  return (
    <View style={styles.container}>
        <Text>setting</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

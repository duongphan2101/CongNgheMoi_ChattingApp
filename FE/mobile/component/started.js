import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';

export default function App({navigation}) {
  return (
    <View style={styles.container}>
        <Image style={{height: '60%', width: '100%', resizeMode: 'contains'}} source={require('../assets/slice1.png')}/>
        <View style={[styles.container, {padding: 20}]}>
            <Text style={{fontSize: 30, fontWeight: 'bold'}}>
                Welcome to App
            </Text>

            <Text style={{color: 'gray', marginTop: 10, textAlign: 'justify'}}>
            Introduction to Vchat, Vchat is a web application that enables seamless 
            chatting and video calling, allowing you to connect easily, quickly, and securely anytime, anywhere.
            </Text>
        </View>
        <View style={[styles.container, 
          {marginBottom: 20, width: '100%', paddingHorizontal: 20}]}>
          <TouchableOpacity style={styles.button}
                onPress={() => navigation.navigate('login')}>
                  <Text style={{fontSize: 18, color: '#fff'}}>
                      Get Started
                  </Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  }, button : {
    backgroundColor: '#007AFF',
    // backgroundColor: 'black',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center', 
    width: '100%'
  }
});

import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
export default function App({navigation}) {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];
  const styles = getStyles(themeColors);
  return (
    <View style={styles.container}>
        <Image style={{height: '60%', width: '100%', resizeMode: 'contains'}} source={require('../assets/slice1.png')}/>
        <View style={[styles.container, {padding: 20}]}>
            <Text style={styles.title}>
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

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  }, button : {
    backgroundColor: themeColors.primary,
    // backgroundColor: 'black',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center', 
    width: '100%'
  }, title: {
    fontSize: 30, 
    fontWeight: 'bold',
    color: themeColors.text,
  }
});

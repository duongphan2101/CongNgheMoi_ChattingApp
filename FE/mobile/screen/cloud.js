import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, TextInput } from 'react-native';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";

export default function App({navigation, route}) {
  
  // const { user } = route.params;
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];

  const styles = getStyles(themeColors);
  return (
    <View style={styles.container}>

        <View style={styles.head}>
          <View style={styles.user}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Entypo name="cloud" size={30} color={'#fff'} style={{paddingLeft: 15}}/>
              <Text style={styles.name}>Cloud</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
            <View style={styles.contextChat}>

              <View style={styles.userChatting}>
                <View style={{alignItems: 'center', paddingHorizontal: 10}}>
                  <Text style={{color: '#ccc'}}>T3 11:30 AM</Text>
                  <View style={styles.blockChat}>
                    <Text style={{color: '#fff'}}>This is Cloud</Text>
                  </View>
                </View>
              </View>

            </View>
        </View>

        <View style={styles.bottomtab}>
           <TouchableOpacity style={styles.touch}>
              <Ionicons name="image" size={40} color={themeColors.primary} />
            </TouchableOpacity>
            <TextInput style={styles.textInput} placeholder='Nhập nội dung ...' placeholderTextColor={'#ccc'} />
            <TouchableOpacity style={styles.touch}>
              <Ionicons name="send" size={40} color={themeColors.primary}/>
            </TouchableOpacity>
        </View>

    </View>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  head: {
    width: '100%',
    backgroundColor: themeColors.primary,
    height: 100,
    paddingTop: 60,
    paddingHorizontal: 20
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  avatar: {
    width: 55,
    height: 55,
    marginLeft: 10,
  },
  name :{
    fontSize: 24,
    color: '#fff',
    paddingHorizontal: 20,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
  },
  bottomtab: {
    height: 90,
    backgroundColor: themeColors.background,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 20,
    borderTopColor: '#ccc',
    borderTopWidth: 1,
  }, 
  textInput: {
    flex: 1,
    height: 50, 
    borderRadius: 10, 
    paddingLeft: 20,
    marginHorizontal: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    color: themeColors.text
  },
  contextChat: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  userChatting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  blockChat: {
    backgroundColor: '#6FD39F',
    padding: 15,
    borderRadius: 20,
  }
});

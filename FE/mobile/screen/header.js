import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];

  const styles = getStyles(themeColors);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.block}>
        <TextInput placeholder='Tìm kiếm' placeholderTextColor={'#fff'} style={styles.TextInputStyle} />
        <TouchableOpacity style={styles.touch}>
          <AntDesign name='search1' size={30} color='#fff'/>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (themeColors) => StyleSheet.create({
  headerContainer: {
    height: 100,
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40
  },
  TextInputStyle: {
    height: 40,
    flex: 1,
    borderRadius: 10,
    paddingLeft: 20,
    borderColor: '#fff',
    borderWidth: 1,
    backgroundColor: '#7399C3',
    color: themeColors.text,
  }, 
  block: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20
  },
  touch: {
    marginLeft: 15
  }
});

export default Header;

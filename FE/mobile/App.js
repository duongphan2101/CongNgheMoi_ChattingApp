// App.js
import React from 'react';
import { View,StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import started from './component/started';
import login from './component/login';
import register from './component/register';
import chat from './component/chat';
import profile from './component/profile';
import contacts from './component/contacts';
import cloud from './component/cloud';
import setting from './component/setting';
import Header from './component/Header';
import chatting from './component/chatting';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Entypo from '@expo/vector-icons/Entypo'
import Ionicons from '@expo/vector-icons/Ionicons'

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator({ navigation, route }) {
  return (
    <Tab.Navigator
      initialRouteName='chatScr'
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'white',
        tabBarStyle: { 
          backgroundColor: '#007AFF', 
          height: 90,
          paddingTop: 20,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >

      <Tab.Screen
        name="profileScr"
        component={profile}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="user" size={30} color={color}
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="chatScr"
        component={chat}
        options={{
          header: () => <Header />,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="message-processing" size={30} color={color}
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="contactsScr"
        component={contacts}
        options={{
          header: () => <Header />,
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="contacts" size={30} color={color}
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="cloudScr"
        component={cloud}
        options={{
          // header: () => <Header />,
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <Entypo name="cloud" size={30} color={color}
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="settingScr"
        component={setting}
        options={{
          header: () => <Header />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="settings" size={28} color={color}
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
            />
          ),
        }}
      />

    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='started'>
        <Stack.Screen 
            name='started' 
            component={started}
            options={{
              headerShown: false}}
          />
          <Stack.Screen 
            name='login' 
            component={login}
            options={{
              headerShown: false}}
          />
          <Stack.Screen 
            name='register' 
            component={register}
            options={{
              headerShown: false}}
          />
          <Stack.Screen 
            name='router' 
            component={TabNavigator}
            options={{
              headerShown: false}}
          />
          <Stack.Screen 
            name='chatting' 
            component={chatting}
            options={{
              headerShown: false}}
          />
          
      </Stack.Navigator>
    </NavigationContainer>
  );
}



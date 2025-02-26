// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './contexts/themeContext';
import started from './screen/started';
import login from './screen/login';
import register from './screen/register';
import chatting from './screen/chatting';
import test from './screen/test';

const Stack = createNativeStackNavigator();
import TabNavigator from "./screen/footer";

export default function App() {
  return (
    <ThemeProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName='started'>
        <Stack.Screen 
            name='started' 
            component={started}
            options={{
              headerShown: false}}
          />

      <Stack.Screen 
            name='test' 
            component={test}
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
    </ThemeProvider>
  );
}

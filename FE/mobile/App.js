// App.js
import React, { useEffect } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider, useTheme } from "./contexts/themeContext";
import { SearchProvider } from "./contexts/searchContext";

import started from "./screen/started";
import login from "./screen/login";
import register from "./screen/register";
import chatting from "./screen/chatting";
import chat from "./screen/chat";
import forgetpassword from "./screen/ForgetPassword/forgetPassword";
import resetpassword from "./screen/ForgetPassword/resetPassword";
import TabNavigator from "./screen/footer";
import AuthLoading from "./screen/authLoading";
// import { setupNotifications } from "./utils/notifications";
import colors from "./themeColors";

const Stack = createNativeStackNavigator();

function AppWrapper() {
  const { theme } = useTheme();
  const themeColors = colors[theme];

  // useEffect(() => {
  //   setupNotifications();
  // }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent'}}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="AuthLoading">
          <Stack.Screen name="AuthLoading" component={AuthLoading} options={{ headerShown: false }} />
          <Stack.Screen name="started" component={started} options={{ headerShown: false }} />
          <Stack.Screen name="login" component={login} options={{ headerShown: false }} />
          <Stack.Screen name="register" component={register} options={{ headerShown: false }} />
          <Stack.Screen name="router" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="chatting" component={chatting} options={{ headerShown: false }} />
          <Stack.Screen name="chat" component={chat} options={{ headerShown: false }} />
          <Stack.Screen name="forgetpassword" component={forgetpassword} options={{ headerShown: false }} />
          <Stack.Screen name="resetpassword" component={resetpassword} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <AppWrapper />
      </SearchProvider>
    </ThemeProvider>
  );
}

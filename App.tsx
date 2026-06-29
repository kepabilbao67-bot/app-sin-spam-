import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { getSettings } from './src/services/storage';
import { initAI } from './src/services/aiAnalyzer';
import { COLORS } from './src/constants';

export default function App() {
  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      if (settings.apiKey) initAI(settings.apiKey);
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

/**
 * FP-30X Controller — App Root.
 *
 * T011: Integrates TabNavigator.
 * T015: Activates react-native-keep-awake to prevent screen dimming during performance.
 *
 * Constitution III: System-Adaptive High-Contrast UI.
 */

import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {useKeepAwake} from 'react-native-keep-awake';
import {TabNavigator} from './src/app/TabNavigator';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  // T015: Prevent screen dimming — critical for live performance use
  useKeepAwake();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

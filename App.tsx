/**
 * FP-30X Controller — App Root.
 *
 * T029: NativeWind provider, navigation container, theme provider,
 * wake lock (react-native-keep-awake).
 * T005 (A1): Service bootstrap — wires services before React mounts.
 *
 * Constitution III: Landscape Hardware-Synth UI.
 */

import './global.css';

import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {useKeepAwake} from 'react-native-keep-awake';
import {TabNavigator} from './src/app/TabNavigator';
import {useAppSettingsStore} from './src/store/appSettingsStore';
import {bootstrap} from './src/app/bootstrap';

// Wire all services before any React component mounts.
// This ensures hooks never see null service references.
bootstrap();

function App(): React.JSX.Element {
  const systemScheme = useColorScheme();
  const themePreference = useAppSettingsStore(s => s.themePreference);
  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');

  // Prevent screen dimming — critical for live performance use
  useKeepAwake();

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

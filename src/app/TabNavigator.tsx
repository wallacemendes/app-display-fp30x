/**
 * Bottom Tab Navigator.
 *
 * T011: Basic tab navigation structure with placeholder screens.
 * T024: ConnectionIndicator integrated into header right.
 * Phase 1 tabs: Tones, GM2, Favorites, Presets
 *
 * Constitution VI: Feature-Module Architecture — each tab maps to one feature.
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StyleSheet} from 'react-native';
import {ConnectionIndicator} from '../features/connection/components/ConnectionIndicator';
import {ToneBrowserScreen} from '../features/tones/screens/ToneBrowserScreen';
import {GM2BrowserScreen} from '../features/gm2/screens/GM2BrowserScreen';
import {FavoritesScreen} from '../features/favorites/screens/FavoritesScreen';
import {PresetsScreen} from '../features/presets/screens/PresetsScreen';

export type TabParamList = {
  Tones: undefined;
  GM2: undefined;
  Favorites: undefined;
  Presets: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function HeaderRight() {
  return <ConnectionIndicator />;
}

export function TabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerRight: HeaderRight,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#E53935',
        tabBarInactiveTintColor: '#808080',
      }}>
      <Tab.Screen
        name="Tones"
        component={ToneBrowserScreen}
        options={{title: 'Tones'}}
      />
      <Tab.Screen
        name="GM2"
        component={GM2BrowserScreen}
        options={{title: 'GM2'}}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{title: 'Favorites'}}
      />
      <Tab.Screen
        name="Presets"
        component={PresetsScreen}
        options={{title: 'Presets'}}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopColor: '#1A1A1A',
  },
  header: {
    backgroundColor: '#000000',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
});

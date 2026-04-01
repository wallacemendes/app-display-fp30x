/**
 * Bottom Tab Navigator.
 *
 * T011: Basic tab navigation structure with placeholder screens.
 * Phase 1 tabs: Tones, GM2, Favorites, Presets
 *
 * Constitution VI: Feature-Module Architecture — each tab maps to one feature.
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet} from 'react-native';

// Placeholder screens — replaced by feature screens in later tasks
function PlaceholderScreen({label}: {label: string}) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{label}</Text>
    </View>
  );
}

function TonesScreen() {
  return <PlaceholderScreen label="Tones" />;
}

function GM2Screen() {
  return <PlaceholderScreen label="GM2" />;
}

function FavoritesScreen() {
  return <PlaceholderScreen label="Favorites" />;
}

function PresetsScreen() {
  return <PlaceholderScreen label="Presets" />;
}

export type TabParamList = {
  Tones: undefined;
  GM2: undefined;
  Favorites: undefined;
  Presets: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#E53935',
        tabBarInactiveTintColor: '#808080',
      }}>
      <Tab.Screen
        name="Tones"
        component={TonesScreen}
        options={{title: 'Tones'}}
      />
      <Tab.Screen
        name="GM2"
        component={GM2Screen}
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
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  placeholderText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabBar: {
    backgroundColor: '#000000',
    borderTopColor: '#1A1A1A',
  },
});

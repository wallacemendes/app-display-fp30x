/**
 * Top Tab Navigator.
 *
 * T028: 3 tabs (PADS | DISPLAY | PRESETS) using material-top-tabs.
 * DISPLAY is the initial/landing route.
 *
 * Constitution III: Landscape Hardware-Synth UI.
 */

import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {View, Text, Pressable} from 'react-native';
import {useAppSettingsStore} from '../store/appSettingsStore';
import {darkColors, lightColors} from '../theme/colors';
import {useColorScheme} from 'react-native';
import {DisplayScreen} from '../screens/display/DisplayScreen';
import {PresetsScreen} from '../screens/presets/PresetsScreen';

// Placeholder screen — replaced in Phase 4
function PadsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-lg">PADS — Phase 4</Text>
    </View>
  );
}

export type TabParamList = {
  Pads: undefined;
  Display: undefined;
  Presets: undefined;
};

const Tab = createMaterialTopTabNavigator<TabParamList>();

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function CustomTabBar({state, descriptors, navigation}: TabBarProps) {
  const systemScheme = useColorScheme();
  const themePreference = useAppSettingsStore(s => s.themePreference);
  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.tabBarBackground,
        paddingHorizontal: 16,
        paddingVertical: 6,
        gap: 8,
      }}>
      {state.routes.map((route: any, index: number) => {
        const {options} = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              if (!isFocused) {
                navigation.navigate(route.name);
              }
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: isFocused
                ? colors.buttonBackground
                : 'transparent',
              borderWidth: isFocused ? 1 : 0,
              borderColor: colors.border,
            }}>
            <Text
              style={{
                fontFamily: 'Orbitron-Bold',
                fontSize: 13,
                letterSpacing: 1.5,
                color: isFocused ? colors.tabBarActive : colors.tabBarInactive,
              }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      initialRouteName="Display"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
      }}>
      <Tab.Screen name="Pads" component={PadsScreen} options={{title: 'PADS'}} />
      <Tab.Screen name="Display" component={DisplayScreen} options={{title: 'DISPLAY'}} />
      <Tab.Screen name="Presets" component={PresetsScreen} options={{title: 'PRESETS'}} />
    </Tab.Navigator>
  );
}

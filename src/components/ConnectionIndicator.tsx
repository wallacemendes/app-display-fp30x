/**
 * T036: BLE Connection Indicator.
 *
 * Shows connection status as a colored icon.
 * Green = connected, Red = disconnected, Grey = idle, Amber = scanning.
 * Tap opens connection info / disconnect button.
 *
 * Constitution III: Landscape Hardware-Synth UI.
 */

import React, {useState, useCallback} from 'react';
import {View, Text, Pressable, Modal} from 'react-native';
import {useConnection} from '../hooks/useConnection';
import {darkColors, lightColors} from '../theme/colors';
import {useColorScheme} from 'react-native';
import {useAppSettingsStore} from '../store/appSettingsStore';

function useThemeColors() {
  const systemScheme = useColorScheme();
  const themePreference = useAppSettingsStore(s => s.themePreference);
  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');
  return isDark ? darkColors : lightColors;
}

export function ConnectionIndicator(): React.JSX.Element {
  const {status, deviceName, scan, connect, disconnect, deviceId} = useConnection();
  const [showPanel, setShowPanel] = useState(false);
  const colors = useThemeColors();

  const statusColor = (() => {
    switch (status) {
      case 'connected':
        return colors.statusConnected;
      case 'scanning':
      case 'connecting':
        return colors.statusScanning;
      case 'disconnected':
        return colors.statusDisconnected;
      default:
        return colors.statusIdle;
    }
  })();

  const handlePress = useCallback(() => {
    if (status === 'idle') {
      scan();
    } else {
      setShowPanel(true);
    }
  }, [status, scan]);

  const handleConnect = useCallback(async () => {
    if (deviceId) {
      await connect(deviceId);
      setShowPanel(false);
    }
  }, [deviceId, connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setShowPanel(false);
  }, [disconnect]);

  return (
    <>
      <Pressable
        onPress={handlePress}
        hitSlop={8}
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: statusColor,
          marginRight: 12,
        }}
      />

      <Modal
        visible={showPanel}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPanel(false)}>
        <Pressable
          style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)'}}
          onPress={() => setShowPanel(false)}>
          <View
            style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 12,
              padding: 20,
              minWidth: 280,
              gap: 12,
            }}>
            <Text style={{color: colors.text, fontSize: 16, fontWeight: '600'}}>
              BLE Connection
            </Text>
            <Text style={{color: colors.textSecondary, fontSize: 14}}>
              Status: {status}
            </Text>
            {deviceName && (
              <Text style={{color: colors.textSecondary, fontSize: 14}}>
                Device: {deviceName}
              </Text>
            )}

            {status === 'connected' && (
              <Pressable
                onPress={handleDisconnect}
                style={{
                  backgroundColor: colors.statusDisconnected,
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}>
                <Text style={{color: '#FFF', fontWeight: '600'}}>Disconnect</Text>
              </Pressable>
            )}

            {(status === 'discovered' || status === 'disconnected') && deviceId && (
              <Pressable
                onPress={handleConnect}
                style={{
                  backgroundColor: colors.statusConnected,
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}>
                <Text style={{color: '#FFF', fontWeight: '600'}}>Connect</Text>
              </Pressable>
            )}

            {status === 'idle' && (
              <Pressable
                onPress={() => { scan(); setShowPanel(false); }}
                style={{
                  backgroundColor: colors.tabBarActive,
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}>
                <Text style={{color: '#FFF', fontWeight: '600'}}>Scan</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

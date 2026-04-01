/**
 * Connection Indicator.
 *
 * T022: Status dot + label displayed in the navigation header.
 * Shows BLE connection status with color-coded indicator.
 *
 * Constitution III: System-Adaptive High-Contrast UI.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import {useConnectionStore} from '../../../store/connectionStore';
import {darkColors, lightColors} from '../../../theme/colors';
import {typography} from '../../../theme/typography';
import {spacing} from '../../../theme/spacing';
import type {ConnectionStatus} from '../../../store/connectionStore';

interface ConnectionIndicatorProps {
  onPress?: () => void;
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  idle: 'Disconnected',
  scanning: 'Scanning...',
  discovered: 'Found',
  connecting: 'Connecting...',
  connected: 'Connected',
  disconnected: 'Disconnected',
};

function getStatusColor(
  status: ConnectionStatus,
  colors: typeof darkColors,
): string {
  switch (status) {
    case 'connected':
      return colors.statusConnected;
    case 'scanning':
    case 'discovered':
    case 'connecting':
      return colors.statusScanning;
    default:
      return colors.statusDisconnected;
  }
}

export function ConnectionIndicator({
  onPress,
}: ConnectionIndicatorProps): React.JSX.Element {
  const status = useConnectionStore((s) => s.status);
  const deviceName = useConnectionStore((s) => s.deviceName);
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const dotColor = getStatusColor(status, colors);
  const label =
    status === 'connected' && deviceName
      ? deviceName
      : STATUS_LABELS[status];

  const isPulsing =
    status === 'scanning' || status === 'connecting';

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      hitSlop={{top: 8, right: 8, bottom: 8, left: 8}}
      accessibilityRole="button"
      accessibilityLabel={`Connection status: ${STATUS_LABELS[status]}`}>
      <View
        style={[
          styles.dot,
          {backgroundColor: dotColor},
          isPulsing && styles.dotPulsing,
        ]}
      />
      <Text
        style={[styles.label, {color: colors.textSecondary}]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  dotPulsing: {
    opacity: 0.7,
  },
  label: {
    ...typography.caption,
  },
});

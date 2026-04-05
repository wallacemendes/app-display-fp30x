/**
 * T037 + T044 + T050: Display Screen — Main display with ToneSelector + StatusBar.
 *
 * Landing screen for the DISPLAY tab. Landscape layout:
 * - Top-right: ConnectionIndicator
 * - Left/center: ToneSelector (category + tone steppers)
 * - Right: StatusBar (Tempo, Beat, Metronome, Volume)
 *
 * Auto-scans on mount if a previously paired device exists.
 *
 * Constitution III: Landscape Hardware-Synth UI.
 */

import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import {ConnectionIndicator} from '../../components/ConnectionIndicator';
import {ToneSelector} from './ToneSelector';
import {StatusBar} from './StatusBar';
import {useConnection} from '../../hooks/useConnection';
import {useThemeColors} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';

export function DisplayScreen(): React.JSX.Element {
  const {status, deviceId, autoConnect} = useConnection();
  const colors = useThemeColors();

  // Auto-connect to previously paired device on mount
  useEffect(() => {
    if (deviceId && status === 'idle') {
      autoConnect();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* Top bar with model name + connection indicator */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}>
        <Text
          style={{
            ...typography.displayXs,
            color: colors.textMuted,
            letterSpacing: 2,
          }}
          allowFontScaling={false}>
          FP-30X
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text
            style={{
              ...typography.bodySmall,
              color:
                status === 'connected'
                  ? colors.statusConnected
                  : colors.textMuted,
            }}>
            {status === 'connected'
              ? 'CONNECTED'
              : status === 'scanning' || status === 'connecting'
                ? 'CONNECTING...'
                : 'OFFLINE'}
          </Text>
          <ConnectionIndicator />
        </View>
      </View>

      {/* Main content — landscape row layout */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          paddingHorizontal: 8,
          paddingBottom: 12,
        }}>
        {/* Left/center area: ToneSelector */}
        <View
          style={{
            flex: 3,
            justifyContent: 'center',
          }}>
          <ToneSelector />
        </View>

        {/* Right area: StatusBar (T049/T050) */}
        <View
          style={{
            flex: 2,
            borderLeftWidth: 1,
            borderLeftColor: colors.border,
            marginLeft: 8,
            paddingLeft: 8,
          }}>
          <StatusBar />
        </View>
      </View>
    </View>
  );
}

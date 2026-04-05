/**
 * T049: StatusBar — Live status bar with Tempo, Beat, Metronome, Volume.
 *
 * Horizontal bar in the right panel of the display screen.
 * Each item shows its value in LCD font (Orbitron) and is tappable:
 * - Tempo: shows "120 BPM", tap -> TempoModal
 * - Beat: shows "4/4", tap -> BeatModal
 * - Metronome: shows "ON"/"OFF", tap -> toggles immediately (DT1)
 * - Volume: shows "100", tap -> VolumeOverlay
 *
 * All values update live from performanceStore (piano notifications).
 *
 * Constitution II: Bidirectional Control Surface — live mirror.
 * Constitution III: Landscape Hardware-Synth UI, LCD font.
 * Constitution IV: DT1 SysEx Protocol Fidelity.
 */

import React, {useState, useCallback} from 'react';
import {View, Text, Pressable, type ViewStyle} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useThemeColors, useIsDark} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import {palette} from '../../theme/colors';
import {usePiano} from '../../hooks/usePiano';
import {TempoModal} from '../../components/modals/TempoModal';
import {BeatModal} from '../../components/modals/BeatModal';
import {VolumeOverlay} from '../../components/modals/VolumeOverlay';

/**
 * Beat value -> display string.
 * DT1 metronomeBeat: 0=0/4, 1=2/4, 2=3/4, 3=4/4, 4=5/4, 5=6/4
 */
const BEAT_DISPLAY: Record<number, string> = {
  0: '0/4',
  1: '2/4',
  2: '3/4',
  3: '4/4',
  4: '5/4',
  5: '6/4',
};

const hapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

export function StatusBar(): React.JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const {
    tempo,
    metronomeBeat,
    metronomeOn,
    volume,
    toggleMetronome,
  } = usePiano();

  const [showTempoModal, setShowTempoModal] = useState(false);
  const [showBeatModal, setShowBeatModal] = useState(false);
  const [showVolumeOverlay, setShowVolumeOverlay] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────

  const handleTempoPress = useCallback(() => {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
    setShowTempoModal(true);
  }, []);

  const handleBeatPress = useCallback(() => {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
    setShowBeatModal(true);
  }, []);

  const handleMetronomePress = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
    toggleMetronome();
  }, [toggleMetronome]);

  const handleVolumePress = useCallback(() => {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
    setShowVolumeOverlay(true);
  }, []);

  // ─── Display Values ───────────────────────────────────────────

  const beatDisplay = BEAT_DISPLAY[metronomeBeat] ?? `${metronomeBeat}`;

  // ─── Status Item Style ────────────────────────────────────────

  const itemStyle: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: isDark ? palette.gray800 : palette.steel100,
    borderWidth: 1,
    borderColor: isDark ? palette.gray600 : palette.steel300,
  };

  const itemPressedStyle: ViewStyle = {
    ...itemStyle,
    backgroundColor: isDark ? palette.gray600 : palette.steel300,
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', paddingHorizontal: 4}}>
      {/* Section Label */}
      <Text
        style={{
          ...typography.label,
          color: colors.textMuted,
          marginBottom: 10,
          textAlign: 'center',
        }}>
        STATUS
      </Text>

      {/* Status Items Grid — 2x2 for landscape fit */}
      <View style={{gap: 8}}>
        {/* Top row: Tempo + Beat */}
        <View style={{flexDirection: 'row', gap: 8}}>
          {/* Tempo */}
          <Pressable
            testID="status-tempo"
            onPress={handleTempoPress}
            style={({pressed}) => (pressed ? itemPressedStyle : itemStyle)}>
            <Text
              style={{
                ...typography.displayXs,
                color: colors.textMuted,
              }}
              allowFontScaling={false}>
              TEMPO
            </Text>
            <Text
              style={{
                ...typography.displayMd,
                color: colors.displayText,
                marginTop: 2,
              }}
              allowFontScaling={false}>
              {tempo}
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.textMuted,
              }}>
              BPM
            </Text>
          </Pressable>

          {/* Beat */}
          <Pressable
            testID="status-beat"
            onPress={handleBeatPress}
            style={({pressed}) => (pressed ? itemPressedStyle : itemStyle)}>
            <Text
              style={{
                ...typography.displayXs,
                color: colors.textMuted,
              }}
              allowFontScaling={false}>
              BEAT
            </Text>
            <Text
              style={{
                ...typography.displayMd,
                color: colors.displayText,
                marginTop: 2,
              }}
              allowFontScaling={false}>
              {beatDisplay}
            </Text>
          </Pressable>
        </View>

        {/* Bottom row: Metronome + Volume */}
        <View style={{flexDirection: 'row', gap: 8}}>
          {/* Metronome Toggle */}
          <Pressable
            testID="status-metronome"
            onPress={handleMetronomePress}
            style={({pressed}) => ({
              ...itemStyle,
              backgroundColor: metronomeOn
                ? isDark
                  ? '#0A2A1A'
                  : '#E0F2E9'
                : pressed
                  ? isDark
                    ? palette.gray600
                    : palette.steel300
                  : isDark
                    ? palette.gray800
                    : palette.steel100,
              borderColor: metronomeOn
                ? colors.statusConnected
                : isDark
                  ? palette.gray600
                  : palette.steel300,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Text
              style={{
                ...typography.displayXs,
                color: colors.textMuted,
              }}
              allowFontScaling={false}>
              METRO
            </Text>
            <Text
              style={{
                ...typography.displayMd,
                color: metronomeOn
                  ? colors.statusConnected
                  : colors.textSecondary,
                marginTop: 2,
              }}
              allowFontScaling={false}>
              {metronomeOn ? 'ON' : 'OFF'}
            </Text>
          </Pressable>

          {/* Volume */}
          <Pressable
            testID="status-volume"
            onPress={handleVolumePress}
            style={({pressed}) => (pressed ? itemPressedStyle : itemStyle)}>
            <Text
              style={{
                ...typography.displayXs,
                color: colors.textMuted,
              }}
              allowFontScaling={false}>
              VOL
            </Text>
            <Text
              style={{
                ...typography.displayMd,
                color: colors.displayText,
                marginTop: 2,
              }}
              allowFontScaling={false}>
              {volume}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Modals */}
      <TempoModal
        visible={showTempoModal}
        onClose={() => setShowTempoModal(false)}
      />
      <BeatModal
        visible={showBeatModal}
        onClose={() => setShowBeatModal(false)}
      />
      <VolumeOverlay
        visible={showVolumeOverlay}
        onClose={() => setShowVolumeOverlay(false)}
      />
    </View>
  );
}

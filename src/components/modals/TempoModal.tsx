/**
 * T046: TempoModal — BPM adjustment modal.
 *
 * Displays current BPM in large Orbitron font with -10/-5/-1/+1/+5/+10
 * delta buttons and a direct numeric input field.
 *
 * Each button press sends a DT1 tempo change immediately via usePiano.
 * Range: 20-250 BPM.
 *
 * Constitution III: Landscape Hardware-Synth UI, LCD font for BPM display.
 * Constitution IV: DT1 SysEx Protocol Fidelity.
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  type ViewStyle,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useThemeColors, useIsDark} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import {palette} from '../../theme/colors';
import {usePiano} from '../../hooks/usePiano';

const BPM_MIN = 20;
const BPM_MAX = 250;

const DELTAS = [-10, -5, -1, 1, 5, 10] as const;

const hapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

interface TempoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TempoModal({
  visible,
  onClose,
}: TempoModalProps): React.JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const {tempo, changeTempo} = usePiano();

  const [directInput, setDirectInput] = useState('');

  const clampBpm = (bpm: number): number =>
    Math.max(BPM_MIN, Math.min(BPM_MAX, bpm));

  const handleDelta = useCallback(
    (delta: number) => {
      ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
      const newBpm = clampBpm(tempo + delta);
      changeTempo(newBpm);
    },
    [tempo, changeTempo],
  );

  const handleDirectSubmit = useCallback(() => {
    const parsed = parseInt(directInput, 10);
    if (!isNaN(parsed)) {
      const clamped = clampBpm(parsed);
      changeTempo(clamped);
    }
    setDirectInput('');
  }, [directInput, changeTempo]);

  const buttonStyle = (isDarkMode: boolean): ViewStyle => ({
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: isDarkMode ? palette.gray700 : palette.steel300,
    borderWidth: 1,
    borderColor: isDarkMode ? palette.gray500 : palette.steel400,
    minWidth: 52,
    alignItems: 'center',
  });

  const buttonPressedStyle = (isDarkMode: boolean): ViewStyle => ({
    ...buttonStyle(isDarkMode),
    backgroundColor: isDarkMode ? palette.gray600 : palette.steel400,
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
        onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 12,
            padding: 24,
            width: '70%',
            maxWidth: 440,
            alignItems: 'center',
          }}
          onPress={() => {
            /* Prevent close on inner press */
          }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              marginBottom: 16,
            }}>
            <Text
              style={{
                ...typography.label,
                color: colors.textSecondary,
              }}>
              TEMPO
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({pressed}) => ({opacity: pressed ? 0.5 : 1})}>
              <Text
                style={{
                  fontSize: 20,
                  color: colors.textMuted,
                  fontWeight: '700',
                }}>
                X
              </Text>
            </Pressable>
          </View>

          {/* Current BPM Display */}
          <View style={{marginBottom: 20, alignItems: 'center'}}>
            <Text
              style={{
                ...typography.displayLg,
                color: colors.displayText,
                fontSize: 48,
                lineHeight: 56,
              }}
              allowFontScaling={false}>
              {tempo}
            </Text>
            <Text
              style={{
                ...typography.displayXs,
                color: colors.textMuted,
                marginTop: 4,
              }}
              allowFontScaling={false}>
              BPM
            </Text>
          </View>

          {/* Delta Buttons Row */}
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 20,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
            {DELTAS.map(delta => (
              <Pressable
                key={delta}
                onPress={() => handleDelta(delta)}
                style={({pressed}) =>
                  pressed ? buttonPressedStyle(isDark) : buttonStyle(isDark)
                }>
                <Text
                  style={{
                    ...typography.displaySm,
                    color: colors.text,
                  }}
                  allowFontScaling={false}>
                  {delta > 0 ? `+${delta}` : `${delta}`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Direct BPM Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            <TextInput
              style={{
                ...typography.displayMd,
                color: colors.text,
                backgroundColor: isDark ? palette.gray700 : palette.steel200,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
                width: 100,
                textAlign: 'center',
              }}
              value={directInput}
              onChangeText={setDirectInput}
              onSubmitEditing={handleDirectSubmit}
              placeholder={`${BPM_MIN}-${BPM_MAX}`}
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={3}
              allowFontScaling={false}
            />
            <Pressable
              onPress={handleDirectSubmit}
              style={({pressed}) =>
                pressed ? buttonPressedStyle(isDark) : buttonStyle(isDark)
              }>
              <Text
                style={{
                  ...typography.label,
                  color: colors.text,
                }}>
                SET
              </Text>
            </Pressable>
          </View>

          {/* Range hint */}
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.textMuted,
              marginTop: 12,
            }}>
            Range: {BPM_MIN} - {BPM_MAX} BPM
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

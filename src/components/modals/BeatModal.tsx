/**
 * T047: BeatModal — Beat (time signature) + rhythm pattern selector.
 *
 * Beat picker: 6 options (0/4 free, 2/4, 3/4, 4/4, 5/4, 6/4).
 * Pattern picker: Off + 7 rhythm subdivisions (1-7).
 *
 * Each selection sends a DT1 command immediately via usePiano.changeMetronomeParam.
 *
 * Constitution III: Landscape Hardware-Synth UI.
 * Constitution IV: DT1 SysEx Protocol Fidelity.
 */

import React, {useCallback} from 'react';
import {View, Text, Pressable, Modal, type ViewStyle} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useThemeColors, useIsDark} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import {palette} from '../../theme/colors';
import {usePiano} from '../../hooks/usePiano';

/**
 * Beat options: value → display label.
 * DT1 metronomeBeat: 0=0/4, 1=2/4, 2=3/4, 3=4/4, 4=5/4, 5=6/4
 */
const BEAT_OPTIONS = [
  {value: 0, label: '0/4', subtitle: 'Free'},
  {value: 1, label: '2/4'},
  {value: 2, label: '3/4'},
  {value: 3, label: '4/4'},
  {value: 4, label: '5/4'},
  {value: 5, label: '6/4'},
] as const;

/**
 * Pattern options: value → display label.
 * DT1 metronomePattern: 0=Off, 1-7=rhythm subdivisions.
 */
const PATTERN_OPTIONS = [
  {value: 0, label: 'Off'},
  {value: 1, label: '1'},
  {value: 2, label: '2'},
  {value: 3, label: '3'},
  {value: 4, label: '4'},
  {value: 5, label: '5'},
  {value: 6, label: '6'},
  {value: 7, label: '7'},
] as const;

const hapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

interface BeatModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BeatModal({
  visible,
  onClose,
}: BeatModalProps): React.JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const {metronomeBeat, metronomePattern, changeMetronomeParam} = usePiano();

  const handleBeatSelect = useCallback(
    (value: number) => {
      ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
      changeMetronomeParam('beat', value);
    },
    [changeMetronomeParam],
  );

  const handlePatternSelect = useCallback(
    (value: number) => {
      ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
      changeMetronomeParam('pattern', value);
    },
    [changeMetronomeParam],
  );

  const pillStyle = (isSelected: boolean): ViewStyle => ({
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: isSelected
      ? isDark
        ? palette.gray600
        : palette.steel400
      : isDark
        ? palette.gray700
        : palette.steel200,
    borderWidth: isSelected ? 2 : 1,
    borderColor: isSelected
      ? colors.categoryText
      : isDark
        ? palette.gray500
        : palette.steel300,
    minWidth: 56,
    alignItems: 'center',
  });

  const pillPressedStyle = (isSelected: boolean): ViewStyle => ({
    ...pillStyle(isSelected),
    opacity: 0.7,
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
            width: '75%',
            maxWidth: 500,
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
              marginBottom: 20,
            }}>
            <Text
              style={{
                ...typography.label,
                color: colors.textSecondary,
              }}>
              BEAT & PATTERN
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

          {/* Beat Picker */}
          <Text
            style={{
              ...typography.label,
              color: colors.textMuted,
              marginBottom: 10,
            }}>
            BEAT
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}>
            {BEAT_OPTIONS.map(option => {
              const isSelected = metronomeBeat === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleBeatSelect(option.value)}
                  style={({pressed}) =>
                    pressed
                      ? pillPressedStyle(isSelected)
                      : pillStyle(isSelected)
                  }>
                  <Text
                    style={{
                      ...typography.displaySm,
                      color: isSelected ? colors.categoryText : colors.text,
                      fontWeight: isSelected ? '700' : '400',
                    }}
                    allowFontScaling={false}>
                    {option.label}
                  </Text>
                  {'subtitle' in option && option.subtitle && (
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}>
                      {option.subtitle}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Pattern Picker */}
          <Text
            style={{
              ...typography.label,
              color: colors.textMuted,
              marginBottom: 10,
            }}>
            PATTERN
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              flexWrap: 'wrap',
            }}>
            {PATTERN_OPTIONS.map(option => {
              const isSelected = metronomePattern === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handlePatternSelect(option.value)}
                  style={({pressed}) =>
                    pressed
                      ? pillPressedStyle(isSelected)
                      : pillStyle(isSelected)
                  }>
                  <Text
                    style={{
                      ...typography.displaySm,
                      color: isSelected ? colors.categoryText : colors.text,
                      fontWeight: isSelected ? '700' : '400',
                    }}
                    allowFontScaling={false}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

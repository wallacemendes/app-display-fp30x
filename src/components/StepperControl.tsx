/**
 * T039: StepperControl — Reusable +/- button pair with tappable label.
 *
 * Hardware button aesthetic: raised steel in light mode, recessed dark in dark mode.
 * Haptic feedback on button press.
 *
 * Constitution III: Landscape Hardware-Synth UI.
 */

import React, {useCallback} from 'react';
import {View, Text, Pressable, type TextStyle, type ViewStyle} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useThemeColors, useIsDark} from '../hooks/useThemeColors';
import {palette} from '../theme/colors';

interface StepperControlProps {
  /** Text label displayed between the +/- buttons */
  label: string;
  /** Called when the "+" (next) button is pressed */
  onIncrement: () => void;
  /** Called when the "-" (prev) button is pressed */
  onDecrement: () => void;
  /** Called when the label area is tapped */
  onLabelPress?: () => void;
  /** Called when the label area is long-pressed */
  onLabelLongPress?: () => void;
  /** Color override for the label text */
  labelColor?: string;
  /** Font family override for the label text */
  labelFontFamily?: string;
  /** Font size override for the label text */
  labelFontSize?: number;
  /** Test ID prefix for testing */
  testID?: string;
}

const hapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

export function StepperControl({
  label,
  onIncrement,
  onDecrement,
  onLabelPress,
  onLabelLongPress,
  labelColor,
  labelFontFamily,
  labelFontSize,
  testID,
}: StepperControlProps): React.JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();

  const handleDecrement = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
    onDecrement();
  }, [onDecrement]);

  const handleIncrement = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
    onIncrement();
  }, [onIncrement]);

  const handleLabelPress = useCallback(() => {
    if (onLabelPress) {
      ReactNativeHapticFeedback.trigger('selection', hapticOptions);
      onLabelPress();
    }
  }, [onLabelPress]);

  const handleLabelLongPress = useCallback(() => {
    if (onLabelLongPress) {
      ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
      onLabelLongPress();
    }
  }, [onLabelLongPress]);

  const buttonStyle: ViewStyle = {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? palette.gray700 : palette.steel300,
    borderWidth: 1,
    borderColor: isDark ? palette.gray500 : palette.steel400,
  };

  const buttonPressedStyle: ViewStyle = {
    ...buttonStyle,
    backgroundColor: isDark ? palette.gray600 : palette.steel400,
  };

  const buttonTextStyle: TextStyle = {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  };

  const labelTextStyle: TextStyle = {
    flex: 1,
    textAlign: 'center',
    fontSize: labelFontSize ?? 18,
    fontFamily: labelFontFamily ?? 'Orbitron-Bold',
    color: labelColor ?? colors.text,
    letterSpacing: 0.5,
  };

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
      {/* Decrement button */}
      <Pressable
        testID={testID ? `${testID}-decrement` : undefined}
        onPress={handleDecrement}
        style={({pressed}) => (pressed ? buttonPressedStyle : buttonStyle)}>
        <Text style={buttonTextStyle} allowFontScaling={false}>
          -
        </Text>
      </Pressable>

      {/* Tappable label area */}
      <Pressable
        testID={testID ? `${testID}-label` : undefined}
        onPress={onLabelPress ? handleLabelPress : undefined}
        onLongPress={onLabelLongPress ? handleLabelLongPress : undefined}
        delayLongPress={500}
        style={{flex: 1, paddingVertical: 4}}
        disabled={!onLabelPress && !onLabelLongPress}>
        <Text
          style={labelTextStyle}
          numberOfLines={1}
          ellipsizeMode="tail"
          allowFontScaling={false}>
          {label}
        </Text>
      </Pressable>

      {/* Increment button */}
      <Pressable
        testID={testID ? `${testID}-increment` : undefined}
        onPress={handleIncrement}
        style={({pressed}) => (pressed ? buttonPressedStyle : buttonStyle)}>
        <Text style={buttonTextStyle} allowFontScaling={false}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * T048: VolumeOverlay — Semi-transparent volume fader overlay.
 *
 * Vertical fader (0-127 range) with current value displayed in Orbitron font.
 * Uses PanResponder for drag interaction, debounced DT1 volume commands.
 *
 * Constitution III: Landscape Hardware-Synth UI, LCD font for value display.
 * Constitution IV: DT1 SysEx Protocol Fidelity.
 */

import React, {useRef, useCallback} from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useThemeColors, useIsDark} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import {palette} from '../../theme/colors';
import {usePiano} from '../../hooks/usePiano';

const VOLUME_MIN = 0;
const VOLUME_MAX = 127;
const FADER_HEIGHT = 200;

const hapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

interface VolumeOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function VolumeOverlay({
  visible,
  onClose,
}: VolumeOverlayProps): React.JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const {volume, changeVolume} = usePiano();

  const faderRef = useRef<View>(null);
  const faderLayoutRef = useRef({y: 0, height: FADER_HEIGHT});
  const lastHapticRef = useRef(0);

  const clampVolume = (v: number): number =>
    Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, Math.round(v)));

  const positionToVolume = useCallback(
    (_e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      // Calculate position relative to fader top
      const faderHeight = faderLayoutRef.current.height;
      const touchY = gestureState.moveY - faderLayoutRef.current.y;
      // Top = max volume, bottom = min volume (inverted)
      const ratio = 1 - Math.max(0, Math.min(1, touchY / faderHeight));
      return clampVolume(ratio * VOLUME_MAX);
    },
    [],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        // Measure fader position on touch start
        faderRef.current?.measureInWindow((_x, y, _w, h) => {
          faderLayoutRef.current = {y, height: h};
          const newVolume = clampVolume(
            (1 -
              Math.max(
                0,
                Math.min(1, (gestureState.y0 - y) / h),
              )) *
              VOLUME_MAX,
          );
          changeVolume(newVolume);
        });
      },
      onPanResponderMove: (e, gestureState) => {
        const newVolume = positionToVolume(e, gestureState);
        changeVolume(newVolume);

        // Haptic feedback at boundaries
        const now = Date.now();
        if (
          (newVolume === VOLUME_MIN || newVolume === VOLUME_MAX) &&
          now - lastHapticRef.current > 300
        ) {
          ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
          lastHapticRef.current = now;
        }
      },
      onPanResponderRelease: () => {
        // Final value already sent during move
      },
    }),
  ).current;

  // Fill percentage for the fader track
  const fillPercent = (volume / VOLUME_MAX) * 100;

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
          alignItems: 'flex-end',
          paddingRight: 40,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
        onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            width: 100,
          }}
          onPress={() => {
            /* Prevent close on inner press */
          }}>
          {/* Volume Value Display */}
          <Text
            style={{
              ...typography.displayMd,
              color: colors.displayText,
              marginBottom: 4,
            }}
            allowFontScaling={false}>
            {volume}
          </Text>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.textMuted,
              marginBottom: 12,
            }}>
            VOL
          </Text>

          {/* Fader Track */}
          <View
            ref={faderRef}
            style={{
              width: 40,
              height: FADER_HEIGHT,
              borderRadius: 8,
              backgroundColor: isDark ? palette.gray700 : palette.steel200,
              borderWidth: 1,
              borderColor: isDark ? palette.gray500 : palette.steel400,
              overflow: 'hidden',
              justifyContent: 'flex-end',
            }}
            {...panResponder.panHandlers}>
            {/* Fill */}
            <View
              style={{
                width: '100%',
                height: `${fillPercent}%`,
                backgroundColor: colors.categoryText,
                borderRadius: 6,
                opacity: 0.8,
              }}
            />
            {/* Thumb indicator */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${fillPercent}%`,
                height: 4,
                backgroundColor: colors.displayText,
                marginBottom: -2,
              }}
            />
          </View>

          {/* Min/Max labels */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: 8,
            }}>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.textMuted,
              }}>
              {VOLUME_MIN}
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.textMuted,
              }}>
              {VOLUME_MAX}
            </Text>
          </View>

          {/* Close button */}
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({pressed}) => ({
              marginTop: 12,
              opacity: pressed ? 0.5 : 1,
            })}>
            <Text
              style={{
                ...typography.label,
                color: colors.textMuted,
              }}>
              CLOSE
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

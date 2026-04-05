/**
 * T057: Quick Tone Slots — 3 always-visible one-tap tone buttons.
 *
 * Each slot shows a tone name + star icon. Tap → apply tone instantly.
 * Long-press → assign from favorites list (or current tone).
 *
 * Constitution III: Landscape Hardware-Synth UI.
 */

import React, {useCallback, useMemo} from 'react';
import {View, Text, Pressable, Alert} from 'react-native';
import {useAppSettingsStore} from '../../store/appSettingsStore';
import {usePerformanceStore} from '../../store/performanceStore';
import {getFP30XEngine} from '../../engine/registry';
import {getPianoService} from '../../hooks/usePiano';
import {useThemeColors} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import type {Tone} from '../../engine/types';

export function QuickToneSlots(): React.JSX.Element {
  const colors = useThemeColors();
  const quickToneSlots = useAppSettingsStore(s => s.quickToneSlots);
  const setQuickToneSlot = useAppSettingsStore(s => s.setQuickToneSlot);
  const activeTone = usePerformanceStore(s => s.activeTone);

  const engine = getFP30XEngine();

  // Resolve slot tone IDs to full Tone objects
  const resolvedSlots = useMemo(() => {
    return quickToneSlots.map(toneId => {
      if (!toneId) return null;
      return engine.tones.findById(toneId) ?? null;
    }) as [Tone | null, Tone | null, Tone | null];
  }, [quickToneSlots, engine.tones]);

  const handleSlotPress = useCallback(
    async (slotIndex: number) => {
      const tone = resolvedSlots[slotIndex];
      if (!tone) return;

      const pianoService = getPianoService();
      if (!pianoService) return;

      // Optimistic UI update
      usePerformanceStore.getState().setActiveTone(tone);
      await pianoService.changeTone(tone);
    },
    [resolvedSlots],
  );

  const handleSlotLongPress = useCallback(
    (slotIndex: number) => {
      const options: string[] = [];
      const actions: (() => void)[] = [];

      // Assign current tone
      if (activeTone) {
        options.push(`Assign: ${activeTone.name}`);
        actions.push(() => {
          setQuickToneSlot(slotIndex as 0 | 1 | 2, activeTone.id);
        });
      }

      // Clear slot
      if (resolvedSlots[slotIndex]) {
        options.push('Clear Slot');
        actions.push(() => {
          setQuickToneSlot(slotIndex as 0 | 1 | 2, null);
        });
      }

      options.push('Cancel');

      Alert.alert(
        `Quick Tone Slot ${slotIndex + 1}`,
        'Assign a tone to this slot for one-tap access.',
        options.map((text, i) => ({
          text,
          onPress: i < actions.length ? actions[i] : undefined,
          style: text === 'Cancel' ? ('cancel' as const) : ('default' as const),
        })),
      );
    },
    [activeTone, resolvedSlots, setQuickToneSlot],
  );

  return (
    <View style={{flexDirection: 'row', gap: 6, paddingHorizontal: 4}}>
      {resolvedSlots.map((tone, index) => (
        <Pressable
          key={index}
          onPress={() => handleSlotPress(index)}
          onLongPress={() => handleSlotLongPress(index)}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 6,
            borderRadius: 6,
            backgroundColor: tone
              ? colors.buttonBackground
              : colors.surface,
            borderWidth: 1,
            borderColor: tone ? colors.border : colors.textMuted,
            borderStyle: tone ? 'solid' : 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 40,
          }}>
          {tone ? (
            <>
              <Text
                style={{
                  ...typography.displayXs,
                  color: colors.toneText,
                  textAlign: 'center',
                }}
                numberOfLines={1}
                allowFontScaling={false}>
                {tone.name}
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.textMuted,
                  fontSize: 9,
                  marginTop: 2,
                }}>
                {tone.categoryName}
              </Text>
            </>
          ) : (
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.textMuted,
                fontSize: 10,
              }}>
              SLOT {index + 1}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

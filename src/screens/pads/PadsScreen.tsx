/**
 * T078: PadsScreen — PADS tab.
 *
 * 4x2 grid of assignable performance pads. Each pad can hold a sequence
 * of DT1 commands that execute on tap. Long-press opens PadConfigModal.
 *
 * Empty pads display "EMPTY" with dashed border.
 * Configured pads show label + command summary.
 *
 * Constitution III: Landscape Hardware-Synth UI.
 * Constitution V: Presentation -> hooks -> services.
 */

import React, {useCallback, useState} from 'react';
import {View, Text, Pressable, FlatList, type ViewStyle} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {usePadConfigStore} from '../../store/padConfigStore';
import type {PadConfig, DT1Command} from '../../store/padConfigStore';
import {getPianoService} from '../../hooks/usePiano';
import {useThemeColors, useIsDark} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import {palette} from '../../theme/colors';
import {PadConfigModal} from './PadConfigModal';

const hapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

/** Build a human-readable summary of a pad's commands. */
function commandSummary(commands: DT1Command[]): string {
  if (commands.length === 0) return '';

  return commands
    .map((cmd) => {
      switch (cmd.type) {
        case 'tone':
          return 'Tone';
        case 'volume':
          return `Vol ${cmd.params.value}`;
        case 'tempo':
          return `${cmd.params.value} BPM`;
        case 'metronomeToggle':
          return 'Metro Toggle';
        case 'voiceMode': {
          const modes = ['Single', 'Split', 'Dual', 'Twin'];
          return modes[cmd.params.value] ?? 'Voice';
        }
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join(' + ');
}

/** Execute all commands in a pad via PianoService. */
async function executePadCommands(commands: DT1Command[]): Promise<void> {
  const pianoService = getPianoService();
  if (!pianoService) return;

  const engine = pianoService.getEngine();
  if (!engine) return;

  const sysexCommands: number[][] = [];

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'tone':
        sysexCommands.push(
          engine.buildToneChange({
            id: '',
            name: '',
            category: cmd.params.category,
            categoryName: '',
            indexHigh: cmd.params.indexHigh,
            indexLow: cmd.params.indexLow,
            position: 0,
            isGM2: cmd.params.category === 0x08,
          }),
        );
        break;
      case 'volume':
        sysexCommands.push(engine.buildVolumeChange(cmd.params.value));
        break;
      case 'tempo':
        sysexCommands.push(engine.buildTempoChange(cmd.params.value));
        break;
      case 'metronomeToggle':
        sysexCommands.push(engine.buildMetronomeToggle());
        break;
      case 'voiceMode':
        sysexCommands.push(engine.buildVoiceModeChange(cmd.params.value));
        break;
    }
  }

  if (sysexCommands.length > 0) {
    await pianoService.applyPreset(sysexCommands);
  }
}

export function PadsScreen(): React.JSX.Element {
  const pads = usePadConfigStore((s) => s.pads);
  const colors = useThemeColors();
  const isDark = useIsDark();
  const [configPadId, setConfigPadId] = useState<string | null>(null);

  const handlePadPress = useCallback((pad: PadConfig) => {
    if (pad.commands.length === 0) return;
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
    executePadCommands(pad.commands);
  }, []);

  const handlePadLongPress = useCallback((pad: PadConfig) => {
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
    setConfigPadId(pad.id);
  }, []);

  const handleCloseConfig = useCallback(() => {
    setConfigPadId(null);
  }, []);

  const renderPad = useCallback(
    ({item}: {item: PadConfig}) => {
      const isEmpty = item.commands.length === 0;
      const summary = commandSummary(item.commands);

      const basePadStyle: ViewStyle = {
        flex: 1,
        aspectRatio: 1.6,
        margin: 6,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        minHeight: 80,
      };

      const emptyStyle: ViewStyle = {
        ...basePadStyle,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: isDark ? palette.gray500 : palette.steel400,
        backgroundColor: isDark ? palette.gray800 : palette.steel100,
      };

      const filledStyle: ViewStyle = {
        ...basePadStyle,
        borderWidth: 2,
        borderColor: item.color,
        backgroundColor: isDark
          ? `${item.color}22`
          : `${item.color}18`,
      };

      return (
        <Pressable
          onPress={() => handlePadPress(item)}
          onLongPress={() => handlePadLongPress(item)}
          delayLongPress={400}
          style={({pressed}) => ({
            ...(isEmpty ? emptyStyle : filledStyle),
            opacity: pressed && !isEmpty ? 0.6 : 1,
            transform: pressed && !isEmpty ? [{scale: 0.95}] : [{scale: 1}],
          })}>
          {isEmpty ? (
            <Text
              style={{
                ...typography.label,
                color: colors.textMuted,
              }}>
              EMPTY
            </Text>
          ) : (
            <>
              <Text
                style={{
                  ...typography.displaySm,
                  color: isDark ? '#E0E0E0' : '#1A1C1F',
                  textAlign: 'center',
                }}
                numberOfLines={1}
                allowFontScaling={false}>
                {item.label}
              </Text>
              {summary ? (
                <Text
                  style={{
                    ...typography.bodySmall,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                  numberOfLines={2}>
                  {summary}
                </Text>
              ) : null}
            </>
          )}
        </Pressable>
      );
    },
    [colors, isDark, handlePadPress, handlePadLongPress],
  );

  const keyExtractor = useCallback((item: PadConfig) => item.id, []);

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        <Text
          style={{
            ...typography.headingLg,
            color: colors.text,
          }}>
          Performance Pads
        </Text>
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.textMuted,
          }}>
          Long-press to configure
        </Text>
      </View>

      {/* 4x2 pad grid */}
      <View style={{flex: 1, justifyContent: 'center', paddingHorizontal: 10}}>
        <FlatList
          data={pads}
          renderItem={renderPad}
          keyExtractor={keyExtractor}
          numColumns={4}
          scrollEnabled={false}
          contentContainerStyle={{
            justifyContent: 'center',
          }}
        />
      </View>

      {/* Config Modal */}
      {configPadId !== null && (
        <PadConfigModal
          visible={configPadId !== null}
          padId={configPadId}
          onClose={handleCloseConfig}
        />
      )}
    </View>
  );
}

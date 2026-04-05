/**
 * T079: PadConfigModal — Configure a single performance pad.
 *
 * Allows setting: label, commands (tone, volume, tempo, metronomeToggle, voiceMode).
 * Each command type has its own input controls.
 *
 * Constitution III: Landscape Hardware-Synth UI.
 * Constitution IV: DT1 SysEx Protocol Fidelity — commands map to DT1 addresses.
 */

import React, {useCallback, useState, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  type ViewStyle,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {usePadConfigStore} from '../../store/padConfigStore';
import type {DT1Command} from '../../store/padConfigStore';
import {useThemeColors, useIsDark} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import {palette} from '../../theme/colors';

const hapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

/** Available command types with display labels. */
const COMMAND_TYPES = [
  {type: 'tone' as const, label: 'Tone Change'},
  {type: 'volume' as const, label: 'Volume'},
  {type: 'tempo' as const, label: 'Tempo'},
  {type: 'metronomeToggle' as const, label: 'Metronome Toggle'},
  {type: 'voiceMode' as const, label: 'Voice Mode'},
] as const;

const VOICE_MODE_LABELS = ['Single', 'Split', 'Dual', 'Twin'];

interface PadConfigModalProps {
  visible: boolean;
  padId: string;
  onClose: () => void;
}

export function PadConfigModal({
  visible,
  padId,
  onClose,
}: PadConfigModalProps): React.JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const pad = usePadConfigStore((s) => s.pads.find((p) => p.id === padId));
  const updatePad = usePadConfigStore((s) => s.updatePad);

  const [label, setLabel] = useState('');
  const [commands, setCommands] = useState<DT1Command[]>([]);

  // Sync local state with store on open
  useEffect(() => {
    if (pad) {
      setLabel(pad.label);
      setCommands([...pad.commands]);
    }
  }, [pad?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
    updatePad(padId, {
      label: label.trim() || `PAD ${parseInt(padId.replace('pad-', ''), 10) + 1}`,
      commands,
    });
    onClose();
  }, [padId, label, commands, updatePad, onClose]);

  const handleAddCommand = useCallback(
    (type: DT1Command['type']) => {
      ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
      let newCmd: DT1Command;
      switch (type) {
        case 'tone':
          newCmd = {type: 'tone', params: {category: 0, indexHigh: 0, indexLow: 0}};
          break;
        case 'volume':
          newCmd = {type: 'volume', params: {value: 100}};
          break;
        case 'tempo':
          newCmd = {type: 'tempo', params: {value: 120}};
          break;
        case 'metronomeToggle':
          newCmd = {type: 'metronomeToggle', params: {}};
          break;
        case 'voiceMode':
          newCmd = {type: 'voiceMode', params: {value: 0}};
          break;
      }
      setCommands((prev) => [...prev, newCmd]);
    },
    [],
  );

  const handleRemoveCommand = useCallback((index: number) => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
    setCommands((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateCommandParam = useCallback(
    (index: number, paramKey: string, value: number) => {
      setCommands((prev) =>
        prev.map((cmd, i) =>
          i === index
            ? {...cmd, params: {...cmd.params, [paramKey]: value}}
            : cmd,
        ),
      );
    },
    [],
  );

  const handleClearPad = useCallback(() => {
    Alert.alert('Clear Pad', 'Remove all commands from this pad?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setCommands([]);
          setLabel(`PAD ${parseInt(padId.replace('pad-', ''), 10) + 1}`);
        },
      },
    ]);
  }, [padId]);

  const pillStyle = (isSelected: boolean): ViewStyle => ({
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: isSelected
      ? isDark
        ? palette.gray600
        : palette.steel400
      : isDark
        ? palette.gray700
        : palette.steel200,
    borderWidth: 1,
    borderColor: isSelected
      ? colors.categoryText
      : isDark
        ? palette.gray500
        : palette.steel300,
  });

  /** Render input controls for a single command. */
  const renderCommandEditor = (cmd: DT1Command, index: number) => {
    const commandLabel = COMMAND_TYPES.find((ct) => ct.type === cmd.type)?.label ?? cmd.type;

    return (
      <View
        key={`cmd-${index}`}
        style={{
          backgroundColor: isDark ? palette.gray700 : palette.steel100,
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
          flexDirection: 'column',
          gap: 8,
        }}>
        {/* Command header with remove button */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            style={{
              ...typography.label,
              color: colors.categoryText,
            }}>
            {commandLabel}
          </Text>
          <Pressable
            onPress={() => handleRemoveCommand(index)}
            hitSlop={8}
            style={({pressed}) => ({opacity: pressed ? 0.5 : 1})}>
            <Text style={{fontSize: 16, color: palette.red, fontWeight: '700'}}>
              REMOVE
            </Text>
          </Pressable>
        </View>

        {/* Command-specific inputs */}
        {cmd.type === 'tone' && (
          <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
            <View style={{flex: 1}}>
              <Text style={{...typography.bodySmall, color: colors.textMuted, marginBottom: 4}}>
                Category (0-8)
              </Text>
              <TextInput
                style={{
                  ...typography.displaySm,
                  color: colors.text,
                  backgroundColor: isDark ? palette.gray800 : palette.white,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  textAlign: 'center',
                }}
                value={String(cmd.params.category ?? 0)}
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  if (!isNaN(n)) {
                    handleUpdateCommandParam(index, 'category', Math.max(0, Math.min(8, n)));
                  }
                }}
                keyboardType="number-pad"
                maxLength={1}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={{...typography.bodySmall, color: colors.textMuted, marginBottom: 4}}>
                Index High
              </Text>
              <TextInput
                style={{
                  ...typography.displaySm,
                  color: colors.text,
                  backgroundColor: isDark ? palette.gray800 : palette.white,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  textAlign: 'center',
                }}
                value={String(cmd.params.indexHigh ?? 0)}
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  if (!isNaN(n)) {
                    handleUpdateCommandParam(index, 'indexHigh', Math.max(0, Math.min(1, n)));
                  }
                }}
                keyboardType="number-pad"
                maxLength={1}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={{...typography.bodySmall, color: colors.textMuted, marginBottom: 4}}>
                Index Low
              </Text>
              <TextInput
                style={{
                  ...typography.displaySm,
                  color: colors.text,
                  backgroundColor: isDark ? palette.gray800 : palette.white,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  textAlign: 'center',
                }}
                value={String(cmd.params.indexLow ?? 0)}
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  if (!isNaN(n)) {
                    handleUpdateCommandParam(index, 'indexLow', Math.max(0, Math.min(127, n)));
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
        )}

        {cmd.type === 'volume' && (
          <View>
            <Text style={{...typography.bodySmall, color: colors.textMuted, marginBottom: 4}}>
              Volume (0-127)
            </Text>
            <TextInput
              style={{
                ...typography.displaySm,
                color: colors.text,
                backgroundColor: isDark ? palette.gray800 : palette.white,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 8,
                paddingVertical: 4,
                textAlign: 'center',
                width: 80,
              }}
              value={String(cmd.params.value ?? 100)}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                if (!isNaN(n)) {
                  handleUpdateCommandParam(index, 'value', Math.max(0, Math.min(127, n)));
                }
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        )}

        {cmd.type === 'tempo' && (
          <View>
            <Text style={{...typography.bodySmall, color: colors.textMuted, marginBottom: 4}}>
              Tempo BPM (20-250)
            </Text>
            <TextInput
              style={{
                ...typography.displaySm,
                color: colors.text,
                backgroundColor: isDark ? palette.gray800 : palette.white,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 8,
                paddingVertical: 4,
                textAlign: 'center',
                width: 80,
              }}
              value={String(cmd.params.value ?? 120)}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                if (!isNaN(n)) {
                  handleUpdateCommandParam(index, 'value', Math.max(20, Math.min(250, n)));
                }
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        )}

        {cmd.type === 'metronomeToggle' && (
          <Text style={{...typography.bodySmall, color: colors.textSecondary}}>
            Toggles metronome on/off (no additional parameters).
          </Text>
        )}

        {cmd.type === 'voiceMode' && (
          <View style={{flexDirection: 'row', gap: 6, flexWrap: 'wrap'}}>
            {VOICE_MODE_LABELS.map((modeLabel, modeIdx) => {
              const isSelected = cmd.params.value === modeIdx;
              return (
                <Pressable
                  key={modeIdx}
                  onPress={() => handleUpdateCommandParam(index, 'value', modeIdx)}
                  style={pillStyle(isSelected)}>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: isSelected ? colors.categoryText : colors.text,
                      fontWeight: isSelected ? '700' : '400',
                    }}>
                    {modeLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  if (!pad) return <></>;

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
            padding: 20,
            width: '80%',
            maxWidth: 550,
            maxHeight: '85%',
          }}
          onPress={() => {/* Prevent close on inner press */}}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
            <Text
              style={{
                ...typography.label,
                color: colors.textSecondary,
              }}>
              CONFIGURE PAD
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Label input */}
            <Text
              style={{
                ...typography.label,
                color: colors.textMuted,
                marginBottom: 6,
              }}>
              LABEL
            </Text>
            <TextInput
              style={{
                ...typography.displaySm,
                color: colors.text,
                backgroundColor: isDark ? palette.gray700 : palette.steel100,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 20,
              }}
              value={label}
              onChangeText={setLabel}
              placeholder="Pad label..."
              placeholderTextColor={colors.textMuted}
              maxLength={20}
            />

            {/* Commands list */}
            <Text
              style={{
                ...typography.label,
                color: colors.textMuted,
                marginBottom: 10,
              }}>
              COMMANDS ({commands.length})
            </Text>

            {commands.map((cmd, index) => renderCommandEditor(cmd, index))}

            {/* Add command buttons */}
            <Text
              style={{
                ...typography.label,
                color: colors.textMuted,
                marginTop: 8,
                marginBottom: 8,
              }}>
              ADD COMMAND
            </Text>
            <View style={{flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 20}}>
              {COMMAND_TYPES.map((ct) => (
                <Pressable
                  key={ct.type}
                  onPress={() => handleAddCommand(ct.type)}
                  style={({pressed}) => ({
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 6,
                    backgroundColor: isDark ? palette.gray700 : palette.steel200,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <Text style={{...typography.bodySmall, color: colors.text}}>
                    + {ct.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 12,
              gap: 10,
            }}>
            {commands.length > 0 && (
              <Pressable
                onPress={handleClearPad}
                style={({pressed}) => ({
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: palette.red,
                  alignItems: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Text
                  style={{
                    ...typography.label,
                    color: palette.red,
                  }}>
                  CLEAR
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={({pressed}) => ({
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text
                style={{
                  ...typography.label,
                  color: colors.textSecondary,
                }}>
                CANCEL
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({pressed}) => ({
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: pressed ? colors.border : colors.categoryText,
                alignItems: 'center',
              })}>
              <Text
                style={{
                  ...typography.label,
                  color: palette.white,
                }}>
                SAVE
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

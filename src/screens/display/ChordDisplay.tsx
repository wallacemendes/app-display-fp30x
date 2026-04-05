/**
 * T069: Chord Display — real-time chord tracker.
 *
 * Shows the currently detected chord in large LCD font.
 * Updates in real time from Note On/Off notifications.
 *
 * Display logic:
 * - 0 notes: empty
 * - 1 note: note name (e.g., "C4")
 * - 2 notes: both names (e.g., "C4 E4")
 * - 3+ notes: chord name (e.g., "C", "Am7") or individual notes
 */

import React from 'react';
import {View, Text} from 'react-native';
import {useChord} from '../../hooks/useChord';
import {useThemeColors} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';

export function ChordDisplay(): React.JSX.Element {
  const chord = useChord();
  const colors = useThemeColors();

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
      }}>
      {chord.noteCount > 0 ? (
        <>
          <Text
            style={{
              ...typography.displayLg,
              fontSize: chord.root ? 36 : 20,
              color: chord.root ? colors.displayText : colors.textSecondary,
              textAlign: 'center',
            }}
            allowFontScaling={false}>
            {chord.name}
          </Text>
          {chord.root && chord.noteCount >= 3 && (
            <Text
              style={{
                ...typography.displayXs,
                color: colors.textMuted,
                marginTop: 4,
              }}
              allowFontScaling={false}>
              {chord.notes.length} notes
            </Text>
          )}
        </>
      ) : (
        <Text
          style={{
            ...typography.displaySm,
            color: colors.textMuted,
            opacity: 0.4,
          }}
          allowFontScaling={false}>
          CHORD
        </Text>
      )}
    </View>
  );
}

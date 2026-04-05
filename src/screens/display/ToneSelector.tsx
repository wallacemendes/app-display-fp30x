/**
 * T040 + T043: ToneSelector — Two-tier category/tone stepper with undo.
 *
 * Category row (cyan): StepperControl for +/-, tap name -> CategoryPickerModal.
 * Tone row (orange): StepperControl for +/-, tap name -> TonePickerModal,
 *   long-press -> tone options (T043).
 * Undo button visible when toneHistory.length > 0.
 *
 * Constitution III: Landscape Hardware-Synth UI.
 * Constitution IV: DT1 SysEx Protocol Fidelity.
 */

import React, {useState, useCallback} from 'react';
import {View, Text, Pressable, Alert} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {StepperControl} from '../../components/StepperControl';
import {CategoryPickerModal} from '../../components/modals/CategoryPickerModal';
import {TonePickerModal} from '../../components/modals/TonePickerModal';
import {useTones} from '../../hooks/useTones';
import {useThemeColors} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';

const hapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

export function ToneSelector(): React.JSX.Element {
  const colors = useThemeColors();
  const {
    categories,
    currentCategory,
    activeTone,
    toneHistory,
    nextTone,
    prevTone,
    nextCategory,
    prevCategory,
    selectTone,
    undo,
    searchByName,
  } = useTones();

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTonePicker, setShowTonePicker] = useState(false);

  // ─── Category Row Handlers ─────────────────────────────────

  const handleCategoryLabelPress = useCallback(() => {
    setShowCategoryPicker(true);
  }, []);

  // ─── Tone Row Handlers ─────────────────────────────────────

  const handleToneLabelPress = useCallback(() => {
    setShowTonePicker(true);
  }, []);

  /**
   * T043: Long-press tone name -> options popup.
   * Simple Alert.alert for now, refined in later phases.
   */
  const handleToneLongPress = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);

    if (!activeTone) return;

    Alert.alert(activeTone.name, `${activeTone.categoryName} #${activeTone.position + 1}`, [
      {
        text: 'Add to Favorites',
        onPress: () => {
          // Placeholder — wired to favoritesStore in Phase 6
        },
      },
      {
        text: 'Set as Default',
        onPress: () => {
          // Placeholder — stores default tone in appSettingsStore
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  }, [activeTone]);

  // ─── Undo Handler ──────────────────────────────────────────

  const handleUndo = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
    undo();
  }, [undo]);

  // ─── Display Text ──────────────────────────────────────────

  const categoryLabel = currentCategory.name;
  const toneLabel = activeTone?.name ?? 'No Tone';

  return (
    <View style={{gap: 12, paddingHorizontal: 16}}>
      {/* Category Row */}
      <View>
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.textMuted,
            marginBottom: 4,
            paddingLeft: 52,
          }}>
          CATEGORY
        </Text>
        <StepperControl
          testID="category-stepper"
          label={categoryLabel}
          onIncrement={nextCategory}
          onDecrement={prevCategory}
          onLabelPress={handleCategoryLabelPress}
          labelColor={colors.categoryText}
          labelFontFamily="Orbitron-Bold"
          labelFontSize={18}
        />
      </View>

      {/* Tone Row */}
      <View>
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.textMuted,
            marginBottom: 4,
            paddingLeft: 52,
          }}>
          TONE
        </Text>
        <StepperControl
          testID="tone-stepper"
          label={toneLabel}
          onIncrement={nextTone}
          onDecrement={prevTone}
          onLabelPress={handleToneLabelPress}
          onLabelLongPress={handleToneLongPress}
          labelColor={colors.toneText}
          labelFontFamily="Orbitron-Bold"
          labelFontSize={20}
        />
      </View>

      {/* Undo Button — visible when toneHistory has entries */}
      {toneHistory.length > 0 && (
        <View style={{alignItems: 'flex-start', paddingLeft: 4}}>
          <Pressable
            testID="undo-button"
            onPress={handleUndo}
            style={({pressed}) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 6,
              opacity: pressed ? 0.6 : 1,
            })}>
            <Text
              style={{
                fontSize: 18,
                color: colors.textSecondary,
              }}>
              {'↩'}
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.textSecondary,
              }}>
              Undo ({toneHistory.length})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        categories={categories}
        currentCategory={currentCategory}
        activeTone={activeTone}
        onSelectTone={selectTone}
      />

      {/* Tone Picker Modal */}
      <TonePickerModal
        visible={showTonePicker}
        onClose={() => setShowTonePicker(false)}
        currentCategory={currentCategory}
        allCategories={categories}
        activeTone={activeTone}
        onSelectTone={selectTone}
        searchByName={searchByName}
      />
    </View>
  );
}

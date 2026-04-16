/**
 * MultiSelectButtons — Sélection multiple pour le chat Théo V2
 *
 * Utilisation : Sources de revenus, Abonnements, Plan d'action
 * 
 * Fonctionnalités :
 * - Cases à cocher visuelles ( sélection multiple )
 * - Emoji icône par option
 * - minSelections / maxSelections validation
 * - Bouton "Aucun de ces choix" si minSelections === 0
 * - Bouton "Continuer" activé seulement si la sélection est valide
 * - Compteur de sélection (X/Y)
 * - Animation d'apparition Moti
 * - État disabled quand l'étape est passée
 * - Thème dark mode Telora (#0A0A0F)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MotiView } from 'moti';
import type { MultiSelectConfig } from '../../lib/budget-assistant-v2/types';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

// ============================================================================
// Props
// ============================================================================

interface MultiSelectButtonsProps {
  config: MultiSelectConfig;
  onSubmit: (selectedIds: string[]) => void;
  onSkipNone?: () => void;
  visible?: boolean;
  /** Désactive tout le composant (quand l'étape est passée) */
  disabled?: boolean;
}

// ============================================================================
// Sous-composant : OptionRow
// ============================================================================

interface OptionRowProps {
  option: { id: string; label: string; icon?: string };
  isSelected: boolean;
  onPress: () => void;
  disabled: boolean;
  index: number;
}

function OptionRow({ option, isSelected, onPress, disabled, index }: OptionRowProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{
        type: 'timing',
        duration: 250,
        delay: index * 40,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.optionRow,
          isSelected && styles.optionRowSelected,
          disabled && styles.optionRowDisabled,
        ]}
      >
        {/* Checkbox */}
        <View style={[
          styles.checkbox,
          isSelected && styles.checkboxSelected,
          disabled && styles.checkboxDisabled,
        ]}>
          {isSelected && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>

        {/* Emoji icon */}
        {option.icon ? (
          <Text style={styles.optionIcon}>{option.icon}</Text>
        ) : null}

        {/* Label */}
        <Text style={[
          styles.optionLabel,
          isSelected && styles.optionLabelSelected,
          disabled && styles.optionLabelDisabled,
        ]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    </MotiView>
  );
}

// ============================================================================
// Composant principal
// ============================================================================

export function MultiSelectButtons({
  config,
  onSubmit,
  onSkipNone,
  visible = true,
  disabled = false,
}: MultiSelectButtonsProps) {
  const {
    options,
    minSelections = 0,
    maxSelections,
    requireAmountPerSelection,
  } = config;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ── Toggle sélection ──
  const toggleOption = useCallback((id: string) => {
    if (disabled) return;

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // Désélectionner
        return prev.filter((sid) => sid !== id);
      }
      // Vérifier maxSelections
      if (maxSelections !== undefined && prev.length >= maxSelections) {
        return prev; // Ne pas ajouter si max atteint
      }
      // Sélectionner
      return [...prev, id];
    });
  }, [disabled, maxSelections]);

  // ── Validation ──
  const isValidSelection = (() => {
    const count = selectedIds.length;
    if (count < minSelections) return false;
    if (maxSelections !== undefined && count > maxSelections) return false;
    return true;
  })();

  const canSubmit = isValidSelection || (selectedIds.length === 0 && minSelections === 0);

  // ── Handlers ──
  const handleSubmit = () => {
    if (disabled || !canSubmit) return;
    onSubmit(selectedIds);
  };

  const handleSkipNone = () => {
    if (disabled) return;
    if (onSkipNone) {
      onSkipNone();
    } else {
      onSubmit([]);
    }
  };

  // ── Compteur ──
  const counterText = (() => {
    const count = selectedIds.length;
    if (maxSelections !== undefined) {
      return `${count}/${maxSelections} sélectionné${count > 1 ? 's' : ''}`;
    }
    if (minSelections > 0) {
      return `${count} sélectionné${count > 1 ? 's' : ''} (min. ${minSelections})`;
    }
    return `${count} sélectionné${count > 1 ? 's' : ''}`;
  })();

  // ── Render ──
  if (!visible) return null;

  const showNoneButton = minSelections === 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={[styles.container, disabled && styles.containerDisabled]}
    >
      {/* Options list */}
      <ScrollView
        style={styles.optionsList}
        contentContainerStyle={styles.optionsContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {options.map((option, index) => (
          <OptionRow
            key={option.id}
            option={option}
            isSelected={selectedIds.includes(option.id)}
            onPress={() => toggleOption(option.id)}
            disabled={disabled}
            index={index}
          />
        ))}
      </ScrollView>

      {/* Counter */}
      <View style={styles.counterRow}>
        <Text style={[
          styles.counterText,
          isValidSelection && styles.counterTextValid,
          selectedIds.length < minSelections && selectedIds.length > 0 && styles.counterTextWarning,
        ]}>
          {counterText}
        </Text>
        {requireAmountPerSelection && selectedIds.length > 0 && (
          <Text style={styles.amountHint}>
            📝 Montants demandés ensuite
          </Text>
        )}
      </View>

      {/* Validation message si minSelections non atteint */}
      {selectedIds.length > 0 && selectedIds.length < minSelections && (
        <Text style={styles.validationMsg}>
          Sélectionne au moins {minSelections} élément{minSelections > 1 ? 's' : ''}
        </Text>
      )}

      {/* Max atteint */}
      {maxSelections !== undefined && selectedIds.length >= maxSelections && (
        <Text style={styles.maxReachedMsg}>
          Maximum atteint ({maxSelections} choix)
        </Text>
      )}

      {/* Bouton Continuer */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          (canSubmit && !disabled) ? styles.continueButtonActive : styles.continueButtonInactive,
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit || disabled}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.continueButtonText,
          (canSubmit && !disabled) ? styles.continueButtonTextActive : styles.continueButtonTextInactive,
        ]}>
          Continuer
        </Text>
      </TouchableOpacity>

      {/* Bouton "Aucun de ces choix" */}
      {showNoneButton && (
        <TouchableOpacity
          style={[styles.noneButton, disabled && styles.noneButtonDisabled]}
          onPress={handleSkipNone}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[styles.noneButtonText, disabled && styles.noneButtonTextDisabled]}>
            Aucun de ces choix
          </Text>
        </TouchableOpacity>
      )}
    </MotiView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },
  containerDisabled: {
    opacity: 0.5,
  },

  // ── Options list ──
  optionsList: {
    maxHeight: 320,
  },
  optionsContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },

  // ── Option row ──
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  optionRowSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '15',
  },
  optionRowDisabled: {
    opacity: 0.5,
  },

  // ── Checkbox ──
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.borderLight,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary,
  },
  checkboxDisabled: {
    borderColor: colors.border,
  },
  checkmark: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },

  // ── Option icon & label ──
  optionIcon: {
    fontSize: 18,
  },
  optionLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.secondary,
    fontWeight: '600',
  },
  optionLabelDisabled: {
    color: colors.textMuted,
  },

  // ── Counter row ──
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border + '30',
  },
  counterText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  counterTextValid: {
    color: colors.secondary,
  },
  counterTextWarning: {
    color: colors.warning,
  },
  amountHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },

  // ── Validation messages ──
  validationMsg: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  maxReachedMsg: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },

  // ── Continue button ──
  continueButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonActive: {
    backgroundColor: colors.secondary,
  },
  continueButtonInactive: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  continueButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  continueButtonTextActive: {
    color: colors.background,
  },
  continueButtonTextInactive: {
    color: colors.textMuted,
  },

  // ── None button ──
  noneButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  noneButtonDisabled: {
    opacity: 0.4,
  },
  noneButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  noneButtonTextDisabled: {
    color: colors.textMuted,
  },
});
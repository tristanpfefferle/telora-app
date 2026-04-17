/**
 * NumericChfInput — Composant de saisie numérique CHF
 * Format suisse : 1'450 (apostrophe comme séparateur de milliers)
 * 
 * Fonctionnalités :
 * - Clavier numérique natif
 * - Formatage temps réel (apostrophe suisse)
 * - Validation min/max
 * - Bouton ✓ (envoi) désactivé si invalide
 * - Bouton « Je n'en ai pas / Pas concerné » (skip)
 * - Chips de montants suggérés (NumericChfWithSuggestionsConfig)
 * - Texte d'aide contextuel (helpText)
 * - Valeur par défaut pré-remplie (defaultValue)
 * - Animation d'apparition (Moti)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { MotiView } from 'moti';
import type { NumericChfConfig, NumericChfWithSuggestionsConfig, SuggestedAmount } from '../../lib/budget-assistant-v2/types';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

// ============================================================================
// Props
// ============================================================================

interface NumericChfInputProps {
  config: NumericChfConfig | NumericChfWithSuggestionsConfig;
  onSubmit: (value: number) => void;
  onSkip?: () => void;
  visible?: boolean;
  /** Désactive tout le composant (quand l'étape est passée) */
  disabled?: boolean;
}

// ============================================================================
// Helpers — formatage suisse
// ============================================================================

/**
 * Formate un nombre en format suisse : 1450 → "1'450"
 * Gère les décimales : 1450.50 → "1'450.50"
 */
const formatCHFSwiss = (num: number): string => {
  const parts = num.toString().split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
};

/**
 * Parse une chaîne formatée suisse en nombre : "1'450" → 1450
 * Supprime les apostrophes et nettoie l'input
 */
const parseCHFInput = (text: string): number => {
  const cleaned = text.replace(/'/g, '').replace(/\s/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formate temps réel l'input de l'utilisateur pendant la saisie
 * Conserve le curseur, n'ajoute les apostrophes que sur la partie entière
 */
const formatLiveInput = (text: string): string => {
  // Supprimer tout ce qui n'est pas chiffre, apostrophe ou point
  let cleaned = text.replace(/[^0-9'.]/g, '');

  // Ne garder qu'un seul point décimal
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
    // Max 2 décimales
    const afterDot = cleaned.slice(dotIndex + 1);
    if (afterDot.length > 2) {
      cleaned = cleaned.slice(0, dotIndex + 3);
    }
  }

  // Séparer partie entière et décimale
  const parts = cleaned.split('.');
  let intPart = parts[0].replace(/'/g, ''); // retirer les apostrophes existantes

  // Ajouter les apostrophes suisses sur la partie entière
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");

  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
};

// ============================================================================
// Type guard — distinguer NumericChfConfig de NumericChfWithSuggestionsConfig
// ============================================================================

function hasSuggestions(
  config: NumericChfConfig | NumericChfWithSuggestionsConfig
): config is NumericChfWithSuggestionsConfig & { suggestions: SuggestedAmount[] } {
  return 'suggestions' in config && Array.isArray((config as NumericChfWithSuggestionsConfig).suggestions);
}

// ============================================================================
// Composant principal
// ============================================================================

export function NumericChfInput({
  config,
  onSubmit,
  onSkip,
  visible = true,
  disabled = false,
}: NumericChfInputProps) {
  const {
    placeholder = "Ex: 1'450",
    min = 0,
    max,
    defaultValue,
    skipButtonLabel,
    skipValue = 0,
    helpText,
  } = config;

  const suggestions = hasSuggestions(config) ? config.suggestions : undefined;

  // ── State ──
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // ── Pré-remplir la valeur par défaut ──
  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== null && defaultValue > 0) {
      const formatted = formatCHFSwiss(defaultValue);
      setInputValue(formatted);
      validateValue(defaultValue);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ──
  const validateValue = useCallback(
    (numValue: number): boolean => {
      // Autoriser 0 si skipValue === 0 ou si l'utilisateur a cliqué un chip à 0
      if (numValue < min) {
        setErrorMsg(`Minimum : ${formatCHFSwiss(min)} CHF`);
        setIsValid(false);
        return false;
      }
      if (max !== undefined && numValue > max) {
        setErrorMsg(`Maximum : ${formatCHFSwiss(max)} CHF`);
        setIsValid(false);
        return false;
      }
      setErrorMsg(null);
      setIsValid(true);
      return true;
    },
    [min, max]
  );

  // ── Handlers ──
  const handleInputChange = (text: string) => {
    if (disabled) return;
    setHasInteracted(true);

    const formatted = formatLiveInput(text);
    setInputValue(formatted);

    const numValue = parseCHFInput(formatted);
    if (formatted.length > 0 && formatted.replace(/'/g, '').length > 0) {
      validateValue(numValue);
    } else {
      setIsValid(false);
      setErrorMsg(null);
    }
  };

  const handleSubmit = () => {
    if (disabled || !isValid) return;
    const numValue = parseCHFInput(inputValue);
    Keyboard.dismiss();
    onSubmit(numValue);
  };

  const handleSkip = () => {
    if (disabled) return;
    Keyboard.dismiss();
    if (onSkip) {
      onSkip();
    } else {
      onSubmit(skipValue);
    }
  };

  const handleSuggestionPress = (suggestion: SuggestedAmount) => {
    if (disabled) return;
    const formatted = formatCHFSwiss(suggestion.value);
    setInputValue(formatted);
    setHasInteracted(true);
    validateValue(suggestion.value);
    // Auto-submit après un léger délai pour laisser la validation s'afficher
    setTimeout(() => {
      Keyboard.dismiss();
      onSubmit(suggestion.value);
    }, 200);
  };

  const focusInput = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // ── Render ──
  if (!visible) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={[styles.container, disabled && styles.containerDisabled]}
    >
      {/* Suggestion chips */}
      {suggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsRow}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.value}
              style={[styles.suggestionChip, disabled && styles.suggestionChipDisabled]}
              onPress={() => handleSuggestionPress(suggestion)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={[styles.suggestionChipText, disabled && styles.suggestionChipTextDisabled]}>
                {suggestion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input + Send row */}
      <View style={styles.inputRow}>
        <View style={[styles.inputWrapper, isValid && hasInteracted && styles.inputWrapperValid, errorMsg && styles.inputWrapperError]}>
          <Text style={styles.chfPrefix}>CHF</Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, disabled && styles.inputDisabled]}
            keyboardType="numeric"
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={inputValue}
            onChangeText={handleInputChange}
            onSubmitEditing={isValid ? handleSubmit : undefined}
            editable={!disabled}
            selectTextOnFocus
            returnKeyType={isValid ? 'done' : 'next'}
            maxLength={15}
          />
        </View>

        {/* Bouton ✓ */}
        <TouchableOpacity
          style={[styles.sendButton, (!isValid || disabled) && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || disabled}
          activeOpacity={0.7}
        >
          <Text style={[styles.sendButtonIcon, (!isValid || disabled) && styles.sendButtonIconDisabled]}>
            ✓
          </Text>
        </TouchableOpacity>
      </View>

      {/* Validation message */}
      {errorMsg && hasInteracted && (
        <MotiView
          from={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <Text style={styles.errorMsg}>{errorMsg}</Text>
        </MotiView>
      )}

      {/* Help text */}
      {helpText && !errorMsg && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}

      {/* Skip button */}
      {skipButtonLabel && (
        <TouchableOpacity
          style={[styles.skipButton, disabled && styles.skipButtonDisabled]}
          onPress={handleSkip}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipButtonText, disabled && styles.skipButtonTextDisabled]}>
            {skipButtonLabel}
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    // Ombre légère pour séparer de la zone de messages
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
  },
  containerDisabled: {
    opacity: 0.5,
  },

  // ── Suggestions ──
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  suggestionChip: {
    backgroundColor: colors.primary + '18',
    borderWidth: 1,
    borderColor: colors.primary + '50',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  suggestionChipDisabled: {
    opacity: 0.4,
  },
  suggestionChipText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  suggestionChipTextDisabled: {
    color: colors.textMuted,
  },

  // ── Input row ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputWrapperValid: {
    borderColor: colors.success + '60',
  },
  inputWrapperError: {
    borderColor: colors.error + '60',
  },
  chfPrefix: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '600',
    paddingVertical: 0,
    height: '100%',
  },
  inputDisabled: {
    color: colors.textMuted,
  },

  // ── Send button ✓ ──
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  sendButtonIcon: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  sendButtonIconDisabled: {
    color: colors.textMuted,
  },

  // ── Validation ──
  errorMsg: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },

  // ── Help text ──
  helpText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },

  // ── Skip button ──
  skipButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  skipButtonDisabled: {
    opacity: 0.4,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  skipButtonTextDisabled: {
    color: colors.textMuted,
  },
});
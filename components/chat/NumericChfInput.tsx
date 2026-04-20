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
 * - **Double champ mensuel/annuel** : si config.frequency est défini,
 *   l'utilisateur peut saisir en mensuel OU annuel, l'autre champ se
 *   remplit automatiquement (conversion ×12 ou ÷12).
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
  onSubmit: (value: number | { salaireNet: number; treizieme: boolean; treiziemeMontant: number }) => void;
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

/**
 * Arrondit un nombre à 2 décimales (pour la division annuel→mensuel)
 */
const roundTo2Decimals = (num: number): number => {
  return Math.round(num * 100) / 100;
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
    frequency,
  } = config;

  const suggestions = hasSuggestions(config) ? config.suggestions : undefined;

  // Mode dual (mensuel + annuel) activé quand frequency est défini
  const isDualMode = !!frequency;
  // Mode 13e salaire activé quand checkbox13e est défini
  const show13eCheckbox = !!config.checkbox13e;

  // ── State ──
  const [inputValue, setInputValue] = useState('');
  const [annualValue, setAnnualValue] = useState('');  // Champ annuel (mode dual)
  const [has13e, setHas13e] = useState(false);          // Checkbox 13e salaire
  const [treiziemeInput, setTreiziemeInput] = useState(''); // Montant du 13e
  const [activeField, setActiveField] = useState<'monthly' | 'annual'>(
    frequency === 'annual' ? 'annual' : 'monthly'
  );
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const annualInputRef = useRef<TextInput>(null);

  // ── Pré-remplir la valeur par défaut ──
  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== null && defaultValue > 0) {
      const formatted = formatCHFSwiss(defaultValue);
      setInputValue(formatted);
      if (isDualMode) {
        setAnnualValue(formatCHFSwiss(roundTo2Decimals(defaultValue * 12)));
      }
      validateValue(defaultValue);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pré-remplir le 13e avec le salaire mensuel quand la checkbox est cochée ──
  useEffect(() => {
    if (show13eCheckbox && has13e && treiziemeInput === '') {
      const salaireNum = parseCHFInput(inputValue);
      if (salaireNum > 0) {
        setTreiziemeInput(formatCHFSwiss(salaireNum));
      }
    }
  }, [has13e]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Handlers — champ mensuel ──
  const handleInputChange = (text: string) => {
    if (disabled) return;
    setHasInteracted(true);
    setActiveField('monthly');

    const formatted = formatLiveInput(text);
    setInputValue(formatted);

    const numValue = parseCHFInput(formatted);
    if (formatted.length > 0 && formatted.replace(/'/g, '').length > 0) {
      // Mettre à jour le champ annuel automatiquement
      if (isDualMode && numValue > 0) {
        setAnnualValue(formatCHFSwiss(roundTo2Decimals(numValue * 12)));
      } else if (isDualMode) {
        setAnnualValue('');
      }
      validateValue(numValue);
    } else {
      if (isDualMode) setAnnualValue('');
      setIsValid(false);
      setErrorMsg(null);
    }
  };

  // ── Handlers — champ annuel ──
  const handleAnnualChange = (text: string) => {
    if (disabled) return;
    setHasInteracted(true);
    setActiveField('annual');

    const formatted = formatLiveInput(text);
    setAnnualValue(formatted);

    const numAnnualValue = parseCHFInput(formatted);
    if (formatted.length > 0 && formatted.replace(/'/g, '').length > 0 && numAnnualValue > 0) {
      // Mettre à jour le champ mensuel automatiquement
      const monthly = roundTo2Decimals(numAnnualValue / 12);
      setInputValue(formatCHFSwiss(monthly));
      validateValue(monthly);
    } else {
      setInputValue('');
      setIsValid(false);
      setErrorMsg(null);
    }
  };

  const handleFocusMonthly = () => {
    setActiveField('monthly');
  };

  const handleFocusAnnual = () => {
    setActiveField('annual');
  };

  const handleSubmit = () => {
    if (disabled) return;
    const numValue = parseCHFInput(inputValue);
    // Validation du salaire
    if (!validateValue(numValue)) return;
    // Si mode 13e, il faut aussi valider le montant du 13e si coché
    if (show13eCheckbox && has13e) {
      const num13e = parseCHFInput(treiziemeInput);
      if (num13e <= 0) return;
    }
    Keyboard.dismiss();
    if (show13eCheckbox) {
      const num13e = has13e ? parseCHFInput(treiziemeInput) : 0;
      onSubmit({
        salaireNet: numValue,
        treizieme: has13e,
        treiziemeMontant: num13e,
      });
    } else {
      onSubmit(numValue);
    }
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
    if (isDualMode) {
      setAnnualValue(formatCHFSwiss(roundTo2Decimals(suggestion.value * 12)));
    }
    validateValue(suggestion.value);
    // Auto-submit après un léger délai pour laisser la validation s'afficher
    setTimeout(() => {
      Keyboard.dismiss();
      onSubmit(suggestion.value);
    }, 200);
  };

  const focusInput = () => {
    if (!disabled) {
      if (isDualMode && activeField === 'annual' && annualInputRef.current) {
        annualInputRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Peut-on soumettre ? (valide + si 13e coché, montant 13e rempli)
  const canSubmit = isValid && (!show13eCheckbox || !has13e || parseCHFInput(treiziemeInput) > 0);

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

      {isDualMode ? (
        // ── Mode dual : 2 champs mensuel / annuel ──
        <View style={styles.dualFieldContainer}>
          {/* Labels */}
          <View style={styles.dualLabelsRow}>
            <Text style={[styles.fieldLabel, activeField === 'monthly' && styles.fieldLabelActive]}>
              /mois
            </Text>
            <Text style={[styles.fieldLabel, activeField === 'annual' && styles.fieldLabelActive]}>
              /an
            </Text>
          </View>

          {/* Les 2 champs côte à côte */}
          <View style={styles.dualInputRow}>
            {/* Champ mensuel */}
            <View style={[
              styles.dualInputWrapper,
              activeField === 'monthly' && isValid && hasInteracted && styles.inputWrapperValid,
              activeField === 'monthly' && errorMsg && hasInteracted && styles.inputWrapperError,
            ]}>
              <Text style={styles.chfPrefix}>CHF</Text>
              <TextInput
                ref={inputRef}
                style={[styles.dualInput, disabled && styles.inputDisabled]}
                keyboardType="numeric"
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                value={inputValue}
                onChangeText={handleInputChange}
                onFocus={handleFocusMonthly}
                onSubmitEditing={isValid ? handleSubmit : undefined}
                editable={!disabled}
                returnKeyType={isValid ? 'done' : 'next'}
                maxLength={15}
              />
            </View>

            {/* Séparateur visuel */}
            <View style={styles.dualSeparator}>
              <Text style={styles.dualSeparatorIcon}>⇄</Text>
            </View>

            {/* Champ annuel */}
            <View style={[
              styles.dualInputWrapper,
              activeField === 'annual' && isValid && hasInteracted && styles.inputWrapperValid,
              activeField === 'annual' && errorMsg && hasInteracted && styles.inputWrapperError,
            ]}>
              <Text style={styles.chfPrefix}>CHF</Text>
              <TextInput
                ref={annualInputRef}
                style={[styles.dualInput, disabled && styles.inputDisabled]}
                keyboardType="numeric"
                placeholder={frequency === 'annual' ? "Ex: 4'560" : "Ex: 54'000"}
                placeholderTextColor={colors.textMuted}
                value={annualValue}
                onChangeText={handleAnnualChange}
                onFocus={handleFocusAnnual}
                onSubmitEditing={isValid ? handleSubmit : undefined}
                editable={!disabled}
                returnKeyType={isValid ? 'done' : 'next'}
                maxLength={15}
              />
            </View>
          </View>

          {/* Bouton ✓ intégré dans le mode dual */}
          <TouchableOpacity
            style={[styles.sendButton, (!canSubmit || disabled) && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || disabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.sendButtonIcon, (!canSubmit || disabled) && styles.sendButtonIconDisabled]}>
              ✓
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ── Mode simple : 1 champ (comportement existant) ──
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
            style={[styles.sendButton, (!canSubmit || disabled) && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || disabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.sendButtonIcon, (!canSubmit || disabled) && styles.sendButtonIconDisabled]}>
              ✓
            </Text>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Checkbox 13e salaire */}
      {show13eCheckbox && (
        <View style={styles.checkbox13eContainer}>
          <TouchableOpacity
            style={styles.checkbox13eRow}
            onPress={() => {
              if (disabled) return;
              const newVal = !has13e;
              setHas13e(newVal);
              if (!newVal) {
                setTreiziemeInput('');
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox13eBox, has13e && styles.checkbox13eBoxChecked]}>
              {has13e && <Text style={styles.checkbox13eCheck}>✓</Text>}
            </View>
            <Text style={styles.checkbox13eLabel}>J'ai un 13e salaire</Text>
          </TouchableOpacity>

          {/* Champ montant du 13e — visible uniquement si coché */}
          {has13e && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'timing', duration: 200 }}
            >
              <Text style={styles.treiziemeLabel}>Montant du 13e (net)</Text>
              <View style={styles.treiziemeInputRow}>
                <View style={[
                  styles.inputWrapper,
                  parseCHFInput(treiziemeInput) > 0 && has13e && styles.inputWrapperValid,
                ]}>
                  <Text style={styles.chfPrefix}>CHF</Text>
                  <TextInput
                    style={[styles.input, disabled && styles.inputDisabled]}
                    keyboardType="numeric"
                    placeholder="Ex: 5'000"
                    placeholderTextColor={colors.textMuted}
                    value={treiziemeInput}
                    onChangeText={(text) => {
                      if (disabled) return;
                      setTreiziemeInput(formatLiveInput(text));
                    }}
                    onSubmitEditing={() => {
                      if (isValid && parseCHFInput(treiziemeInput) > 0) handleSubmit();
                    }}
                    editable={!disabled}
                    selectTextOnFocus
                    returnKeyType={isValid ? 'done' : 'next'}
                    maxLength={15}
                  />
                </View>
                <Text style={styles.treiziemeHint}>/an (un seul versement)</Text>
              </View>
            </MotiView>
          )}
        </View>
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

  // ── Simple input row ──
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

  // ── Dual field mode ──
  dualFieldContainer: {
    gap: 8,
  },
  dualLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabelActive: {
    color: colors.primary,
  },
  dualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dualInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    height: 52,
  },
  dualInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
    paddingVertical: 0,
    height: '100%',
  },
  dualSeparator: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualSeparatorIcon: {
    color: colors.textMuted,
    fontSize: 16,
  },

  // ── Send button ✓ ──
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
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

  // ── Checkbox 13e salaire ──
  checkbox13eContainer: {
    marginTop: spacing.md,
  },
  checkbox13eRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox13eBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox13eBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkbox13eCheck: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  checkbox13eLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  treiziemeLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  treiziemeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  treiziemeHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
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
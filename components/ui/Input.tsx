import React from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../lib/theme';

interface InputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  multiline?: boolean;
}

export function Input({
  value,
  onChange,
  placeholder,
  label,
  error,
  keyboardType = 'default',
  autoFocus = false,
  autoCapitalize,
  secureTextEntry = false,
  multiline = false,
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[
          styles.input,
          error ? styles.inputError : styles.inputNormal,
          multiline && { height: 96, textAlignVertical: 'top' },
        ]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputNormal: { borderColor: colors.border },
  inputError: { borderColor: colors.error },
  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
});

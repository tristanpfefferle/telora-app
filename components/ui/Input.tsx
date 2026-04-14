import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { clsx } from 'clsx';

interface InputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoFocus?: boolean;
  multiline?: boolean;
  className?: string;
}

export function Input({
  value,
  onChange,
  placeholder,
  label,
  error,
  keyboardType = 'default',
  autoFocus = false,
  multiline = false,
  className,
}: InputProps) {
  return (
    <View className={clsx('w-full', className)}>
      {label && (
        <Text className="text-textPrimary font-heading mb-2 text-sm">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#71717A"
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        multiline={multiline}
        className={clsx(
          'bg-surface border rounded-lg px-4 py-3',
          'text-textPrimary font-body text-base',
          error ? 'border-error' : 'border-border',
          'focus:border-primary',
          multiline && 'h-24'
        )}
      />
      {error && (
        <Text className="text-error text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}

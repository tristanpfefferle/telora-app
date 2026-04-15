import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { MotiView } from 'moti';
import { colors, borderRadius, spacing } from '../../lib/theme';

interface Message {
  _id: string | number;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
    avatar?: string;
  };
  type?: 'text' | 'options' | 'summary';
  options?: Array<{
    label: string;
    value: string;
  }>;
  onOptionSelect?: (value: string) => void;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSend: (messages: Message[]) => void;
  onOptionSelect?: (option: string) => void;
  isTyping?: boolean;
  placeholder?: string;
}

export function ChatInterface({
  messages,
  onSend,
  onOptionSelect,
  isTyping = false,
  placeholder = 'Écris ton message...',
}: ChatInterfaceProps) {
  const renderBubble = (props: any) => {
    const { currentMessage } = props;
    const isBot = currentMessage?.user._id === 0;

    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: colors.surface,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          },
          right: {
            backgroundColor: colors.primary,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          },
        }}
        textStyle={{
          left: {
            color: colors.textPrimary,
            fontSize: 15,
          },
          right: {
            color: colors.textPrimary,
            fontSize: 15,
          },
        }}
      />
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 12,
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send
        {...props}
        containerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 4,
        }}
      >
        <View style={styles.sendButton}>
          <Text style={styles.sendIcon}>➤</Text>
        </View>
      </Send>
    );
  };

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: 1,
          name: 'Toi',
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        textInputStyle={{
          color: colors.textPrimary,
          fontSize: 15,
        }}
        textInputProps={{
          cursorColor: colors.primary,
        }}
        isTyping={isTyping}
        renderTypingIndicator={() => (
          <View style={styles.typingContainer}>
            <MotiView
              from={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 500,
                loop: true,
              }}
              style={styles.typingBubble}
            >
              <Text style={styles.typingText}>Telora écrit...</Text>
            </MotiView>
          </View>
        )}
        alwaysShowSend
        scrollToBottom
        scrollToBottomStyle={{
          backgroundColor: colors.primary,
          width: 40,
          height: 40,
          borderRadius: 20,
        }}
      />
    </View>
  );
}

interface OptionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function OptionButton({ label, onPress, disabled = false }: OptionButtonProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: 15,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.optionButton,
          disabled && styles.optionButtonDisabled,
        ]}
        activeOpacity={0.7}
      >
        <Text style={styles.optionLabel}>
          {label}
        </Text>
      </TouchableOpacity>
    </MotiView>
  );
}

interface OptionsListProps {
  options: Array<{ label: string; value: string }>;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function OptionsList({ options, onSelect, disabled = false }: OptionsListProps) {
  return (
    <View style={styles.optionsList}>
      {options.map((option, index) => (
        <OptionButton
          key={index}
          label={option.label}
          onPress={() => onSelect(option.value)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    padding: 12,
  },
  sendIcon: {
    color: colors.textPrimary,
    fontSize: 18,
  },
  typingContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignSelf: 'flex-start',
  },
  typingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  optionsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});

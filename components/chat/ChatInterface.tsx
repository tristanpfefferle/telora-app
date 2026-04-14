import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { clsx } from 'clsx';
import { GiftedChat, Bubble, Send, InputToolbar, Actions, Composer } from 'react-native-gifted-chat';
import { MotiView } from 'moti';

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
            backgroundColor: '#15151E',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          },
          right: {
            backgroundColor: '#FF6B35',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          },
        }}
        textStyle={{
          left: {
            color: '#FFFFFF',
            fontSize: 15,
          },
          right: {
            color: '#FFFFFF',
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
          backgroundColor: '#15151E',
          borderTopWidth: 1,
          borderTopColor: '#27272A',
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
        <View className="bg-primary rounded-full p-3">
          <Text className="text-white text-lg">➤</Text>
        </View>
      </Send>
    );
  };

  return (
    <View className="flex-1 bg-background">
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
        placeholderTextColor="#71717A"
        textInputStyle={{
          color: '#FFFFFF',
          fontSize: 15,
        }}
        textInputProps={{
          cursorColor: '#FF6B35',
        }}
        isTyping={isTyping}
        renderTypingIndicator={() => (
          <View className="px-4 py-2">
            <MotiView
              from={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 500,
                loop: true,
              }}
              className="bg-surface rounded-lg px-4 py-3 self-start"
            >
              <Text className="text-textSecondary text-sm">Telora écrit...</Text>
            </MotiView>
          </View>
        )}
        alwaysShowSend
        scrollToBottom
        scrollToBottomStyle={{
          backgroundColor: '#FF6B35',
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
        className={clsx(
          'bg-surface border border-primary rounded-lg px-5 py-4 mb-3',
          disabled && 'opacity-50'
        )}
        activeOpacity={0.7}
      >
        <Text className="text-primary font-heading text-base text-center">
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
    <View className="px-4 py-3">
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

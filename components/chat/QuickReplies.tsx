import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius } from '../../lib/theme';

interface QuickReply {
  id: string;
  label: string;
  value?: any;
  icon?: string;
}

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  visible?: boolean;
}

export function QuickReplyBar({ replies, onSelect, visible = true }: QuickRepliesProps) {
  if (!visible || replies.length === 0) {
    return null;
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 300,
      }}
      style={styles.container}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {replies.map((reply, index) => (
          <MotiView
            key={reply.id}
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'timing',
              duration: 200,
              delay: index * 50,
            }}
          >
            <TouchableOpacity
              onPress={() => onSelect(reply)}
              activeOpacity={0.7}
              style={styles.button}
            >
              {reply.icon && <Text style={styles.icon}>{reply.icon}</Text>}
              <Text style={styles.label}>{reply.label}</Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },
  scrollContent: {
    gap: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '60',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

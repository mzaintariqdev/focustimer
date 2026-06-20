import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { spacing, fontSize, radius, shadow } from '../theme';

export default function TaskCard({ task, onToggle, onDelete, onEdit, onPress, index }) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }, task.completed && styles.cardCompleted]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <TouchableOpacity
          style={[styles.checkbox, { borderColor: colors.primary }, task.completed && { backgroundColor: colors.primary }]}
          onPress={onToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }, task.completed && { textDecorationLine: 'line-through', color: colors.textMuted }]} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.sessionBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.sessionText, { color: colors.primary }]}>
                🍅 {task.sessions || 0} session{task.sessions !== 1 ? 's' : ''}
              </Text>
            </View>
            {task.completed && (
              <View style={[styles.doneBadge, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.doneText, { color: colors.success }]}>✓ Done</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.background }]}
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.sm },
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    elevation: 2,
  },
  cardCompleted: { opacity: 0.65 },
  checkbox: {
    width: 26, height: 26,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  content: { flex: 1, gap: spacing.xs },
  title: { fontSize: fontSize.md, fontWeight: '500', lineHeight: 21 },
  metaRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  sessionBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  sessionText: { fontSize: fontSize.xs, fontWeight: '500' },
  doneBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  doneText: { fontSize: fontSize.xs, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: spacing.xs, flexShrink: 0 },
  editBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  editIcon: { fontSize: 15 },
  deleteBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  deleteIcon: { fontSize: 15 },
});
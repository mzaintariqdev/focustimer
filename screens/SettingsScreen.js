import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { spacing, fontSize, radius, shadow } from '../theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, mode, setTheme } = useTheme();

  const themeOptions = [
    { label: '☀️  Light', value: 'light' },
    { label: '🌙  Dark', value: 'dark' },
    { label: '📱  System', value: 'system' },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            Customise your experience
          </Text>
        </View>

        {/* Theme section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            APPEARANCE
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, ...shadow.sm }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Theme</Text>
            <View style={styles.themeRow}>
              {themeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.themeChip,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    mode === opt.value && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryLight,
                    },
                  ]}
                  onPress={() => setTheme(opt.value)}
                >
                  <Text
                    style={[
                      styles.themeChipText,
                      { color: colors.textSecondary },
                      mode === opt.value && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* About section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ABOUT
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, ...shadow.sm }]}>
            {[
              { label: 'App', value: 'FocusTimer' },
              { label: 'Version', value: '1.0.0' },
              { label: 'Built with', value: 'React Native + Expo' },
              { label: 'Developer', value: 'Zain Tariq 🚀' },
            ].map((item, i, arr) => (
              <View
                key={item.label}
                style={[
                  styles.row,
                  i < arr.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pomodoro info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            HOW IT WORKS
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, ...shadow.sm }]}>
            {[
              { emoji: '🍅', title: 'Focus Session', desc: 'Pick a task and set your timer. Stay focused until it ends.' },
              { emoji: '☕', title: 'Short Break', desc: '5 minutes to rest after each session.' },
              { emoji: '📊', title: 'Track Progress', desc: 'View your sessions, streaks and focus time in Stats.' },
              { emoji: '🔥', title: 'Build Streaks', desc: 'Focus every day to build and maintain your streak.' },
            ].map((item, i, arr) => (
              <View
                key={item.title}
                style={[
                  styles.infoRow,
                  i < arr.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.infoEmoji}>{item.emoji}</Text>
                <View style={styles.infoText}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Portfolio badge */}
        <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            🎓 Built as a React Native portfolio project
          </Text>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  heading: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  subheading: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: 0,
  },
  themeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  themeChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: fontSize.md,
  },
  rowValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  infoEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  infoText: { flex: 1 },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  badge: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
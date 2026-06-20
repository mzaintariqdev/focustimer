import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontSize, spacing } from '../theme';

export default function EmptyState({ icon, title, subtitle }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  icon: { fontSize: 56, marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: '600', textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
});
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {
  getTodaySessions,
  getWeekSessions,
  getStreak,
  getAllTimeStats,
  getSessions,
} from '../storage';
import { spacing, fontSize, radius, shadow } from '../theme';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [todaySessions, setTodaySessions] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [streak, setStreak] = useState(0);
  const [allTime, setAllTime] = useState({ totalSessions: 0, totalHours: 0, remainingMins: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    setLoading(true);
    const [today, week, streakVal, allTimeVal, all] = await Promise.all([
      getTodaySessions(),
      getWeekSessions(),
      getStreak(),
      getAllTimeStats(),
      getSessions(),
    ]);
    setTodaySessions(today);
    setWeekData(week);
    setStreak(streakVal);
    setAllTime(allTimeVal);
    setRecentSessions(all.slice(0, 20));
    setLoading(false);
  };

  const todayMinutes = todaySessions.reduce((s, x) => s + (x.duration || 0), 0);
  const maxCount = Math.max(...weekData.map((d) => d.count), 1);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingBox}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading stats...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>Your Stats</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>Keep the momentum going 💪</Text>
        </View>

        {/* Stat cards */}
        <View style={styles.cardRow}>
          <View style={[styles.statCard, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.statCardEmoji}>🍅</Text>
            <Text style={[styles.statCardValue, { color: colors.text }]}>{todaySessions.length}</Text>
            <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Sessions today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.successLight }]}>
            <Text style={styles.statCardEmoji}>⏱️</Text>
            <Text style={[styles.statCardValue, { color: colors.text }]}>{todayMinutes}</Text>
            <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Minutes today</Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.statCard, { backgroundColor: colors.warningLight }]}>
            <Text style={styles.statCardEmoji}>🔥</Text>
            <Text style={[styles.statCardValue, { color: colors.text }]}>{streak}</Text>
            <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Day streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={styles.statCardEmoji}>🏆</Text>
            <Text style={[styles.statCardValue, { color: colors.text }]}>{allTime.totalSessions}</Text>
            <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>All-time</Text>
          </View>
        </View>

        {/* Total focus time */}
        <View style={[styles.allTimeBox, { backgroundColor: colors.primary }]}>
          <Text style={styles.allTimeTitle}>Total Focus Time</Text>
          <View style={styles.allTimeRow}>
            <Text style={styles.allTimeValue}>
              {allTime.totalHours}<Text style={styles.allTimeUnit}>h </Text>
              {allTime.remainingMins}<Text style={styles.allTimeUnit}>m</Text>
            </Text>
            <Text style={styles.allTimeDesc}>of deep focus completed</Text>
          </View>
        </View>

        {/* 7 day chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Last 7 Days</Text>
          <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
            {weekData.map((day, index) => (
              <View key={index} style={styles.barColumn}>
                <Text style={[styles.barCount, { color: colors.primary }]}>
                  {day.count > 0 ? day.count : ''}
                </Text>
                <View style={[styles.barTrack, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max((day.count / maxCount) * 100, day.count > 0 ? 8 : 0),
                        backgroundColor: day.label === 'Today' ? colors.primary : colors.primaryLight,
                      },
                    ]}
                  />
                </View>
                <Text style={[
                  styles.barLabel,
                  { color: colors.textSecondary },
                  day.label === 'Today' && { color: colors.primary, fontWeight: '700' },
                ]}>
                  {day.label}
                </Text>
                <Text style={[styles.barMins, { color: colors.textMuted }]}>
                  {day.minutes > 0 ? `${day.minutes}m` : '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent sessions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Sessions</Text>
          {recentSessions.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyEmoji}>🍅</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No sessions yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Complete your first focus session to see it here
              </Text>
            </View>
          ) : (
            recentSessions.map((session) => (
              <View key={session.id} style={[styles.sessionCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.sessionIcon, { backgroundColor: colors.primaryLight }]}>
                  <Text style={styles.sessionIconText}>🍅</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>
                    {session.taskTitle || 'Focus Session'}
                  </Text>
                  <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                    {formatDate(session.completedAt)}
                  </Text>
                </View>
                <View style={[styles.sessionDuration, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.sessionDurationText, { color: colors.primary }]}>
                    {session.duration}m
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {streak > 0 && (
          <View style={[styles.streakBanner, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
            <Text style={styles.streakBannerEmoji}>
              {streak >= 7 ? '🏆' : streak >= 3 ? '🔥' : '⭐'}
            </Text>
            <Text style={[styles.streakBannerText, { color: colors.text }]}>
              {streak >= 7 ? `${streak} day streak! You're unstoppable!`
                : streak >= 3 ? `${streak} day streak! Keep it up!`
                : `${streak} day streak! Great start!`}
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: fontSize.md },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  heading: { fontSize: fontSize.xxl, fontWeight: '700' },
  subheading: { fontSize: fontSize.sm, marginTop: 2 },
  cardRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 2,
  },
  statCardEmoji: { fontSize: 28, marginBottom: 4 },
  statCardValue: { fontSize: fontSize.xxl, fontWeight: '700' },
  statCardLabel: { fontSize: fontSize.xs, textAlign: 'center', marginTop: 2 },
  allTimeBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    elevation: 4,
  },
  allTimeTitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 4,
  },
  allTimeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  allTimeValue: { fontSize: fontSize.xxxl, fontWeight: '700', color: '#FFFFFF' },
  allTimeUnit: { fontSize: fontSize.lg, fontWeight: '400', color: 'rgba(255,255,255,0.8)' },
  allTimeDesc: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', flex: 1 },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: spacing.md,
    elevation: 2,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barCount: { fontSize: fontSize.xs, fontWeight: '700', height: 16 },
  barTrack: {
    height: 100,
    width: '70%',
    justifyContent: 'flex-end',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: radius.sm },
  barLabel: { fontSize: 9, textAlign: 'center' },
  barMins: { fontSize: 9, textAlign: 'center' },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    elevation: 2,
  },
  sessionIcon: {
    width: 36, height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionIconText: { fontSize: 18 },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: fontSize.md, fontWeight: '600' },
  sessionDate: { fontSize: fontSize.xs, marginTop: 2 },
  sessionDuration: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  sessionDurationText: { fontSize: fontSize.xs, fontWeight: '700' },
  emptyBox: { alignItems: 'center', padding: spacing.xl, borderRadius: radius.lg },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.xs },
  emptySubtext: { fontSize: fontSize.sm, textAlign: 'center' },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  streakBannerEmoji: { fontSize: 28 },
  streakBannerText: { fontSize: fontSize.md, fontWeight: '600', flex: 1 },
});
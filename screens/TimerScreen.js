import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Modal, Animated, Easing, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useTimer, MODE } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, fontSize, radius } from '../theme';

const DURATIONS = [
  { label: '15 min', value: 15, emoji: '⚡' },
  { label: '25 min', value: 25, emoji: '🍅' },
  { label: '50 min', value: 50, emoji: '🔥' },
  { label: 'Custom', value: 0, emoji: '✏️' },
];

const RING_SIZE = 220;
const STROKE_WIDTH = 14;

export default function TimerScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const timer = useTimer();
  const task = route?.params?.task;

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customError, setCustomError] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start session automatically if coming from task tap and timer is idle
  useEffect(() => {
    if (task && timer.mode === MODE.IDLE) {
      timer.changeDuration(timer.selectedDuration);
    }
  }, []);

  // Pulse animation
  useEffect(() => {
    if (timer.isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [timer.isRunning]);

  // AppState is now handled in TimerContext globally

  const handleSelectDuration = (d) => {
    if (timer.mode !== MODE.IDLE) return;
    if (d.value === 0) { setCustomMinutes(''); setCustomError(''); setShowCustomModal(true); return; }
    timer.changeDuration(d.value);
  };

  const handleCustomConfirm = () => {
    const mins = parseInt(customMinutes);
    if (!customMinutes || isNaN(mins)) { setCustomError('Please enter a number'); return; }
    if (mins < 1) { setCustomError('Minimum is 1 minute'); return; }
    if (mins > 180) { setCustomError('Maximum is 180 minutes'); return; }
    setCustomError('');
    timer.changeDuration(mins);
    setShowCustomModal(false);
    setCustomMinutes('');
  };

  const handleStart = () => {
    // If another task's session is already running — ask user what to do
    if (timer.mode !== MODE.IDLE && timer.task?.id !== task?.id) {
      Alert.alert(
        '⏱️ Session in progress',
        `You have an active session for "${timer.task?.title}". What would you like to do?`,
        [
          { text: 'Keep current', style: 'cancel' },
          {
            text: 'Switch task',
            style: 'destructive',
            onPress: () => {
              timer.reset();
              setTimeout(() => {
                timer.startSession(task, timer.selectedDuration);
              }, 100);
            },
          },
        ]
      );
      return;
    }
    timer.startSession(task || timer.task, timer.selectedDuration);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = timer.totalTime > 0 ? timer.timeLeft / timer.totalTime : 0;
  const isIdle = timer.mode === MODE.IDLE;
  const isBreak = timer.mode === MODE.BREAK;
  const isDone = timer.mode === MODE.DONE;
  const ringColor = isBreak ? colors.success : colors.primary;
  const currentTask = task || timer.task;

  const modeLabel = isBreak ? '☕ Break Time' : isDone ? '✅ Session Complete!' : '🍅 Focus Session';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Warning banner — different task has active session */}
        {timer.mode !== MODE.IDLE && timer.mode !== MODE.DONE && timer.task?.id !== task?.id && (
          <TouchableOpacity
            style={[styles.warningBanner, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={[styles.warningText, { color: colors.text }]}>
              "{timer.task?.title}" session is running. Tap to go back.
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        {/* Task header */}
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
            {currentTask?.title || 'Focus Session'}
          </Text>
          <View style={styles.sessionRow}>
            <View style={[styles.sessionBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.sessionBadgeText, { color: colors.primary }]}>🍅 {timer.sessionsToday} today</Text>
            </View>
            <View style={[styles.sessionBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.sessionBadgeText, { color: colors.primary }]}>📊 {timer.totalSessions} total</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.modeLabel, { color: isBreak ? colors.success : colors.primary }]}>
          {modeLabel}
        </Text>

        {/* Ring */}
        <Animated.View style={[styles.ringWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.ringContainer}>
            <View style={[styles.ring, { borderColor: colors.border }]} />
            <View style={[styles.ring, {
              borderTopColor: ringColor,
              borderRightColor: progress > 0.25 ? ringColor : 'transparent',
              borderBottomColor: progress > 0.5 ? ringColor : 'transparent',
              borderLeftColor: progress > 0.75 ? ringColor : 'transparent',
              transform: [{ rotate: '-90deg' }],
            }]} />
            <View style={styles.ringCenter}>
              <Text style={[styles.timeText, { color: colors.text }]}>{formatTime(timer.timeLeft)}</Text>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                {isBreak ? 'break remaining' : 'remaining'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Duration picker */}
        {isIdle && (
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d.label}
                style={[
                  styles.durationChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  timer.selectedDuration === d.value && d.value !== 0 && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                ]}
                onPress={() => handleSelectDuration(d)}
              >
                <Text style={styles.durationEmoji}>{d.emoji}</Text>
                <Text style={[
                  styles.durationLabel,
                  { color: colors.textSecondary },
                  timer.selectedDuration === d.value && d.value !== 0 && { color: colors.primary },
                ]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {isIdle && (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleStart}>
              <Text style={styles.primaryBtnText}>▶  Start Focus</Text>
            </TouchableOpacity>
          )}
          {timer.mode === MODE.FOCUS && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={timer.reset}>
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>↺  Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={timer.pauseResume}>
                <Text style={styles.primaryBtnText}>{timer.isRunning ? '⏸  Pause' : '▶  Resume'}</Text>
              </TouchableOpacity>
            </View>
          )}
          {isBreak && (
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={timer.skipBreak}>
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>⏭  Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.success }]} onPress={timer.startBreak}>
                <Text style={styles.primaryBtnText}>{timer.isRunning ? '⏸  Pause' : '▶  Start Break'}</Text>
              </TouchableOpacity>
            </View>
          )}
          {isDone && (
            <View style={styles.doneBox}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={[styles.doneTitle, { color: colors.text }]}>Amazing work!</Text>
              <Text style={[styles.doneSub, { color: colors.textSecondary }]}>
                You completed a {timer.selectedDuration}-minute focus session
              </Text>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: spacing.sm }]} onPress={timer.reset}>
                <Text style={styles.primaryBtnText}>Start Another</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom duration modal */}
      <Modal visible={showCustomModal} transparent animationType="fade" onRequestClose={() => setShowCustomModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Duration</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>Enter minutes (1–180)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: customError ? colors.danger : colors.border }]}
              keyboardType="number-pad"
              placeholder="e.g. 25"
              placeholderTextColor={colors.textMuted}
              value={customMinutes}
              onChangeText={(t) => { setCustomMinutes(t.replace(/[^0-9]/g, '')); setCustomError(''); }}
              maxLength={3}
              autoFocus
            />
            {customError ? <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {customError}</Text> : null}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalCancel, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => { setShowCustomModal(false); setCustomError(''); }}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: colors.primary }]} onPress={handleCustomConfirm}>
                <Text style={styles.modalConfirmText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  warningEmoji: { fontSize: 18 },
  warningText: { flex: 1, fontSize: fontSize.sm, fontWeight: '500' },
  backBtn: { marginTop: spacing.sm, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  backText: { fontSize: fontSize.md, fontWeight: '500' },
  taskHeader: { marginBottom: spacing.sm },
  taskTitle: { fontSize: fontSize.xl, fontWeight: '700', lineHeight: 28, marginBottom: spacing.sm },
  sessionRow: { flexDirection: 'row', gap: spacing.sm },
  sessionBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  sessionBadgeText: { fontSize: fontSize.sm, fontWeight: '600' },
  modeLabel: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.md, marginTop: spacing.sm },
  ringWrapper: { alignItems: 'center', marginBottom: spacing.lg },
  ringContainer: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: RING_SIZE - STROKE_WIDTH,
    height: RING_SIZE - STROKE_WIDTH,
    borderRadius: (RING_SIZE - STROKE_WIDTH) / 2,
    borderWidth: STROKE_WIDTH,
    borderColor: 'transparent',
  },
  ringCenter: { alignItems: 'center' },
  timeText: { fontSize: 52, fontWeight: '700', letterSpacing: 2 },
  timeLabel: { fontSize: fontSize.sm, marginTop: 4 },
  durationRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  durationChip: { alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, minWidth: 72, elevation: 1 },
  durationEmoji: { fontSize: 20, marginBottom: 2 },
  durationLabel: { fontSize: fontSize.xs, fontWeight: '600' },
  controls: { alignItems: 'center', width: '100%' },
  btnRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  primaryBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, elevation: 1 },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  doneBox: { alignItems: 'center', width: '100%', gap: spacing.sm },
  doneEmoji: { fontSize: 48 },
  doneTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  doneSub: { fontSize: fontSize.md, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { borderRadius: radius.xl, padding: spacing.lg, width: '82%', elevation: 8 },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: fontSize.sm, marginBottom: spacing.md },
  modalInput: { borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.xl, borderWidth: 1.5, textAlign: 'center', fontWeight: '700', marginBottom: spacing.sm },
  errorText: { fontSize: fontSize.sm, marginBottom: spacing.sm, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalCancel: { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', borderWidth: 1 },
  modalCancelText: { fontWeight: '500', fontSize: fontSize.md },
  modalConfirm: { flex: 2, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '700', fontSize: fontSize.md },
});
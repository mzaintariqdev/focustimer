import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTimer, MODE } from '../context/TimerContext';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import EmptyState from '../components/EmptyState';
import { getTasks, addTask, toggleTask, deleteTask, editTask, getTodaySessions } from '../storage';
import { spacing, fontSize, radius } from '../theme';

export default function TasksScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const timer = useTimer();

  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [todayCount, setTodayCount] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      loadTodayCount();
    }, [])
  );

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  const loadTodayCount = async () => {
    const sessions = await getTodaySessions();
    setTodayCount(sessions.length);
  };

  const handleAdd = async (task) => {
    const updated = await addTask(task);
    setTasks(updated);
  };

  const handleToggle = async (id) => {
    const updated = await toggleTask(id);
    setTasks(updated);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteTask(id);
          setTasks(updated);
        },
      },
    ]);
  };

  const handleEdit = async (updatedTask) => {
    const updated = await editTask(updatedTask);
    setTasks(updated);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const activeTasks = tasks.filter((t) => !t.completed).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning 🌤️';
    if (h < 17) return 'Good afternoon ☀️';
    return 'Good evening 🌙';
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isTimerActive = timer && timer.mode !== MODE.IDLE && timer.mode !== MODE.DONE;

  return (
    <View style={[styles.safe, { backgroundColor: colors.background, paddingTop: insets.top }]}>

      {/* Animated header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            }],
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.text }]}>{greeting()}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {activeTasks === 0
              ? 'All tasks complete! 🎉'
              : `${activeTasks} task${activeTasks !== 1 ? 's' : ''} to focus on`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Active session banner */}
      {isTimerActive && (
        <TouchableOpacity
          style={[
            styles.activeBanner,
            { backgroundColor: timer.mode === MODE.BREAK ? colors.success : colors.primary },
          ]}
          onPress={() => navigation.navigate('Timer', { task: timer.task })}
          activeOpacity={0.85}
        >
          <Text style={styles.activeBannerEmoji}>
            {timer.mode === MODE.BREAK ? '☕' : '🍅'}
          </Text>
          <View style={styles.activeBannerInfo}>
            <Text style={styles.activeBannerTitle}>
              {timer.mode === MODE.BREAK ? 'Break in progress' : 'Session in progress'}
            </Text>
            <Text style={styles.activeBannerSub}>
              {timer.task?.title || 'Focus session'} • {formatTime(timer.timeLeft)} left
            </Text>
          </View>
          <View style={styles.activeBannerRight}>
            <Text style={styles.activeBannerTime}>{formatTime(timer.timeLeft)}</Text>
            <Text style={styles.activeBannerArrow}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Today pill */}
      {todayCount > 0 && (
        <View style={[styles.todayPill, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
          <Text style={[styles.todayPillText, { color: colors.success }]}>
            🍅 {todayCount} session{todayCount !== 1 ? 's' : ''} completed today
          </Text>
        </View>
      )}

      {/* Filter tabs */}
      <View style={[styles.filters, { backgroundColor: colors.surface }]}>
        {['all', 'active', 'done'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterText,
              { color: filter === f ? '#FFFFFF' : colors.textSecondary },
              filter === f && { fontWeight: '700' },
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'active' && activeTasks > 0 ? ` (${activeTasks})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task list */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TaskCard
            task={item}
            index={index}
            onToggle={() => handleToggle(item.id)}
            onDelete={() => handleDelete(item.id)}
            onEdit={() => setEditingTask(item)}
            onPress={() => navigation.navigate('Timer', { task: item })}
          />
        )}
        contentContainerStyle={[
          styles.list,
          filteredTasks.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="📝"
            title={filter === 'done' ? 'No completed tasks' : 'No tasks yet'}
            subtitle={
              filter === 'done'
                ? 'Complete a task to see it here'
                : "Tap '+ Add' to create your first focus task"
            }
          />
        }
      />

      <AddTaskModal
        visible={showAddModal}
        onAdd={handleAdd}
        onClose={() => setShowAddModal(false)}
      />
      <EditTaskModal
        visible={!!editingTask}
        task={editingTask}
        onSave={handleEdit}
        onClose={() => setEditingTask(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: fontSize.xl, fontWeight: '700' },
  subtitle: { fontSize: fontSize.sm, marginTop: 2 },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    elevation: 3,
  },
  addBtnText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    elevation: 4,
  },
  activeBannerEmoji: { fontSize: 28, flexShrink: 0 },
  activeBannerInfo: { flex: 1 },
  activeBannerTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeBannerSub: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  activeBannerRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  activeBannerTime: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  activeBannerArrow: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
  },
  todayPill: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  todayPillText: { fontSize: fontSize.sm, fontWeight: '600' },
  filters: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  filterText: { fontSize: fontSize.sm },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  listEmpty: { flex: 1 },
});
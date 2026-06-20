import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TASKS: 'focustimer:tasks',
  SESSIONS: 'focustimer:sessions',
};

// ── Tasks ──────────────────────────────────────────────
export const getTasks = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveTasks = async (tasks) => {
  try {
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('saveTasks error', e);
  }
};

export const addTask = async (task) => {
  const tasks = await getTasks();
  const newTask = {
    id: Date.now().toString(),
    title: task.title,
    completed: false,
    sessions: 0,
    createdAt: new Date().toISOString(),
  };
  const updated = [newTask, ...tasks];
  await saveTasks(updated);
  return updated;
};

export const toggleTask = async (id) => {
  const tasks = await getTasks();
  const updated = tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  await saveTasks(updated);
  return updated;
};

export const editTask = async (updatedTask) => {
  // Update task title
  const tasks = await getTasks();
  const updatedTasks = tasks.map((t) =>
    t.id === updatedTask.id ? { ...t, title: updatedTask.title } : t
  );
  await saveTasks(updatedTasks);

  // Also update taskTitle in all sessions for this task
  const sessions = await getSessions();
  const updatedSessions = sessions.map((s) =>
    s.taskId === updatedTask.id ? { ...s, taskTitle: updatedTask.title } : s
  );
  await AsyncStorage.setItem('focustimer:sessions', JSON.stringify(updatedSessions));

  return updatedTasks;
};

export const deleteTask = async (id) => {
  const tasks = await getTasks();
  const updated = tasks.filter((t) => t.id !== id);
  await saveTasks(updated);
  return updated;
};

export const incrementTaskSession = async (id) => {
  const tasks = await getTasks();
  const updated = tasks.map((t) =>
    t.id === id ? { ...t, sessions: (t.sessions || 0) + 1 } : t
  );
  await saveTasks(updated);
  return updated;
};

// ── Sessions ───────────────────────────────────────────
export const getSessions = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addSession = async (session) => {
  const sessions = await getSessions();
  const newSession = {
    id: Date.now().toString(),
    taskId: session.taskId,
    taskTitle: session.taskTitle,
    duration: session.duration,
    completedAt: new Date().toISOString(),
  };
  const updated = [newSession, ...sessions];
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(updated));
  return updated;
};

export const getTodaySessions = async () => {
  const sessions = await getSessions();
  const today = new Date().toDateString();
  return sessions.filter(
    (s) => new Date(s.completedAt).toDateString() === today
  );
};

// ── Stats helpers ──────────────────────────────────────
export const getWeekSessions = async () => {
  const sessions = await getSessions();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const daySessions = sessions.filter(
      (s) => new Date(s.completedAt).toDateString() === dateStr
    );
    days.push({
      date: dateStr,
      label: i === 0 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' }),
      count: daySessions.length,
      minutes: daySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
    });
  }
  return days;
};

export const getStreak = async () => {
  const sessions = await getSessions();
  if (sessions.length === 0) return 0;

  const uniqueDays = [
    ...new Set(sessions.map((s) => new Date(s.completedAt).toDateString())),
  ].sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toDateString();
    if (uniqueDays[i] === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export const getAllTimeStats = async () => {
  const sessions = await getSessions();
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  return { totalSessions, totalMinutes, totalHours, remainingMins };
};
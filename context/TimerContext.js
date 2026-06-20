import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { addSession, incrementTaskSession } from '../storage';
import {
  registerForNotifications,
  sendSessionCompleteNotification,
  scheduleSessionEndNotification,
  cancelScheduledNotifications,
} from '../services/notifications';

const TimerContext = createContext(null);

export const MODE = { IDLE: 'idle', FOCUS: 'focus', BREAK: 'break', DONE: 'done' };
const BREAK_DURATION = 5;

export function TimerProvider({ children }) {
  const [mode, setMode] = useState(MODE.IDLE);
  const [task, setTask] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null); // exact timestamp when session ends
  const appStateRef = useRef(AppState.currentState);
  const modeRef = useRef(mode);
  const taskRef = useRef(task);
  const selectedDurationRef = useRef(selectedDuration);

  // Keep refs in sync with state
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { taskRef.current = task; }, [task]);
  useEffect(() => { selectedDurationRef.current = selectedDuration; }, [selectedDuration]);

  useEffect(() => {
    registerForNotifications();
  }, []);

  // AppState handler — schedule notification on background, correct time on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
        // Going to background
        if (isRunning && endTimeRef.current) {
          const secondsLeft = Math.max(
            Math.floor((endTimeRef.current - Date.now()) / 1000), 1
          );
          // Schedule notification to fire at exact end time
          await scheduleSessionEndNotification(
            taskRef.current?.title || 'Session',
            secondsLeft,
            modeRef.current === MODE.BREAK
          );
        }
      }

      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // Coming to foreground — cancel scheduled notification (we handle it in app)
        await cancelScheduledNotifications();

        if (isRunning && endTimeRef.current) {
          const remaining = Math.floor((endTimeRef.current - Date.now()) / 1000);
          if (remaining <= 0) {
            // Session ended while in background
            setTimeLeft(0);
            handleSessionComplete();
          } else {
            // Correct the time
            setTimeLeft(remaining);
          }
        }
      }

      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [isRunning]);

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    endTimeRef.current = null;
    await cancelScheduledNotifications();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const currentMode = modeRef.current;
    const currentTask = taskRef.current;
    const currentDuration = selectedDurationRef.current;

    if (currentMode === MODE.FOCUS) {
      await addSession({
        taskId: currentTask?.id,
        taskTitle: currentTask?.title || 'Untimed session',
        duration: currentDuration,
      });
      if (currentTask?.id) await incrementTaskSession(currentTask.id);
      setSessionsToday((s) => s + 1);
      setTotalSessions((s) => s + 1);
      await sendSessionCompleteNotification(currentTask?.title || 'Session', false);
      setMode(MODE.BREAK);
      modeRef.current = MODE.BREAK;
      const breakTime = BREAK_DURATION * 60;
      setTimeLeft(breakTime);
      setTotalTime(breakTime);
    } else if (currentMode === MODE.BREAK) {
      await sendSessionCompleteNotification('', true);
      setMode(MODE.DONE);
      modeRef.current = MODE.DONE;
    }
  }, []);

  // Countdown interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const remaining = Math.floor((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          setTimeLeft(0);
          handleSessionComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 500); // tick every 500ms for accuracy
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleSessionComplete]);

  const startSession = (newTask, duration) => {
    setTask(newTask);
    taskRef.current = newTask;
    setTotalSessions(newTask?.sessions || 0);
    setSelectedDuration(duration);
    selectedDurationRef.current = duration;
    const secs = duration * 60;
    setTimeLeft(secs);
    setTotalTime(secs);
    endTimeRef.current = Date.now() + secs * 1000;
    setMode(MODE.FOCUS);
    modeRef.current = MODE.FOCUS;
    setIsRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const pauseResume = async () => {
    if (isRunning) {
      // Pausing — cancel scheduled notification and save remaining time
      await cancelScheduledNotifications();
      endTimeRef.current = null;
      setIsRunning(false);
    } else {
      // Resuming — set new end time based on current timeLeft
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const reset = async () => {
    clearInterval(intervalRef.current);
    await cancelScheduledNotifications();
    endTimeRef.current = null;
    setIsRunning(false);
    setMode(MODE.IDLE);
    modeRef.current = MODE.IDLE;
    const secs = selectedDurationRef.current * 60;
    setTimeLeft(secs);
    setTotalTime(secs);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startBreak = async () => {
    if (isRunning) {
      await cancelScheduledNotifications();
      endTimeRef.current = null;
      setIsRunning(false);
    } else {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const skipBreak = async () => {
    clearInterval(intervalRef.current);
    await cancelScheduledNotifications();
    endTimeRef.current = null;
    setMode(MODE.DONE);
    modeRef.current = MODE.DONE;
    setIsRunning(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const changeDuration = (duration) => {
    setSelectedDuration(duration);
    selectedDurationRef.current = duration;
    const secs = duration * 60;
    setTimeLeft(secs);
    setTotalTime(secs);
    endTimeRef.current = null;
    Haptics.selectionAsync();
  };

  return (
    <TimerContext.Provider value={{
      mode, task, selectedDuration, timeLeft, totalTime,
      isRunning, sessionsToday, totalSessions,
      setTimeLeft, setMode,
      startSession, pauseResume, reset,
      startBreak, skipBreak, changeDuration,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) return null;
  return context;
};
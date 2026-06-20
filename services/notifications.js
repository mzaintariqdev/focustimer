import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForNotifications = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('timer', {
        name: 'Focus Timer',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
        sound: true,
      });
    }
    return true;
  } catch (e) {
    return null;
  }
};

// Schedule notification to fire at exact end time
export const scheduleSessionEndNotification = async (taskTitle, secondsLeft, isBreak) => {
  try {
    // Cancel any existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Must be at least 1 second in the future
    const seconds = Math.max(Math.round(secondsLeft), 1);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: isBreak ? '☕ Break time over!' : '🍅 Focus session complete!',
        body: isBreak
          ? 'Ready to focus again? Tap to start your next session.'
          : `Great work on "${taskTitle}"! Time for a well-deserved break.`,
        sound: true,
        priority: 'max',
        ...(Platform.OS === 'android' && { channelId: 'timer' }),
      },
      trigger: {
        type: 'timeInterval',
        seconds: seconds,
        repeats: false,
      },
    });

    console.log(`Notification scheduled in ${seconds} seconds`);
  } catch (e) {
    console.log('Schedule notification error:', e);
  }
};

// Cancel all scheduled notifications
export const cancelScheduledNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {}
};

// Immediate notification when session completes while app is open
export const sendSessionCompleteNotification = async (taskTitle, isBreak) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isBreak ? '☕ Break time over!' : '🍅 Focus session complete!',
        body: isBreak
          ? 'Ready to focus again?'
          : `Great work on "${taskTitle}"! Take a well-deserved break.`,
        sound: true,
        priority: 'max',
        ...(Platform.OS === 'android' && { channelId: 'timer' }),
      },
      trigger: {
        type: 'timeInterval',
        seconds: 1,
        repeats: false,
      },
    });
  } catch (e) {
    Alert.alert(
      isBreak ? '☕ Break time over!' : '🍅 Session Complete!',
      isBreak ? 'Ready to focus again?' : `Great work on "${taskTitle}"!`,
      [{ text: 'OK' }]
    );
  }
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DailyMemoryMap } from '../types/DailyMemory';
import { formatStorageDate } from './dayMemoryService';

export const DAILY_MEMORY_REMINDER_HOUR = 21;

const REMINDER_CHANNEL_ID = 'day-memory-reminders';
const REMINDER_NOTIFICATION_ID_KEY = '@expensemate_day_memory_reminder_id';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

const isReminderSupported = Platform.OS !== 'web';

const loadScheduledReminderId = async () => AsyncStorage.getItem(REMINDER_NOTIFICATION_ID_KEY);

const saveScheduledReminderId = async (notificationId: string | null) => {
    if (!notificationId) {
        await AsyncStorage.removeItem(REMINDER_NOTIFICATION_ID_KEY);
        return;
    }

    await AsyncStorage.setItem(REMINDER_NOTIFICATION_ID_KEY, notificationId);
};

const configureReminderChannel = async () => {
    if (Platform.OS !== 'android') {
        return;
    }

    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: 'Day log reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#2563eb',
    });
};

export const ensureDayMemoryReminderPermission = async () => {
    if (!isReminderSupported) {
        return false;
    }

    const currentPermissions = await Notifications.getPermissionsAsync();

    if (currentPermissions.status === 'granted') {
        await configureReminderChannel();
        return true;
    }

    const requestedPermissions = await Notifications.requestPermissionsAsync();

    if (requestedPermissions.status !== 'granted') {
        return false;
    }

    await configureReminderChannel();
    return true;
};

export const getNextReminderTime = (now: Date = new Date()) => {
    const next = new Date(now);
    next.setHours(DAILY_MEMORY_REMINDER_HOUR, 0, 0, 0);

    if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1);
    }

    return next;
};

export const cancelDayMemoryReminder = async () => {
    if (!isReminderSupported) {
        return;
    }

    const scheduledId = await loadScheduledReminderId();

    if (scheduledId) {
        try {
            await Notifications.cancelScheduledNotificationAsync(scheduledId);
        } catch (error) {
            console.error('Failed to cancel day memory reminder:', error);
        }
    }

    await saveScheduledReminderId(null);
};

export const scheduleDayMemoryReminder = async (entries: DailyMemoryMap) => {
    if (!isReminderSupported) {
        return null;
    }

    const permissionGranted = await ensureDayMemoryReminderPermission();

    if (!permissionGranted) {
        return null;
    }

    await cancelDayMemoryReminder();

    const now = new Date();
    const todayKey = formatStorageDate(now);
    const hasEntryToday = Boolean(entries[todayKey]);
    const reminderTime = new Date(now);
    reminderTime.setHours(DAILY_MEMORY_REMINDER_HOUR, 0, 0, 0);

    if (hasEntryToday || reminderTime.getTime() <= now.getTime()) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const trigger = Platform.OS === 'android'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DATE as const,
            date: reminderTime,
            channelId: REMINDER_CHANNEL_ID,
        }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DATE as const,
            date: reminderTime,
        };

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Log your day before it slips away',
            body: 'You have not saved today yet. Add a quick summary or a few hourly notes before 9 PM ends.',
            sound: false,
        },
        trigger,
    });

    await saveScheduledReminderId(notificationId);
    return notificationId;
};
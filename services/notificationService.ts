import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    } as Notifications.NotificationBehavior),
});

export const requestPermissions = async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
        });
    }

    return true;
};

export const scheduleReminder = async (
    noteId: string,
    title: string,
    date: Date,
    repeat: 'once' | 'daily' | 'weekly'
): Promise<string | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    // Cancel any existing reminder for this note
    await cancelReminder(noteId);

    let trigger: Notifications.NotificationTriggerInput;

    if (repeat === 'once') {
        trigger = { type: Notifications.SchedulableTriggerInputTypes.DATE, date };
    } else if (repeat === 'daily') {
        trigger = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: date.getHours(),
            minute: date.getMinutes(),
        };
    } else {
        // weekly
        trigger = {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: date.getDay() + 1, // 1=Sunday ... 7=Saturday
            hour: date.getHours(),
            minute: date.getMinutes(),
        };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: '🔔 Note Reminder',
            body: title,
            data: { noteId },
            sound: 'default',
        },
        trigger,
    });

    return notificationId;
};

export const cancelReminder = async (noteIdOrNotifId: string): Promise<void> => {
    try {
        // Try to cancel by notification ID directly
        await Notifications.cancelScheduledNotificationAsync(noteIdOrNotifId);
    } catch {
        // If that fails, get all and cancel matching ones
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.noteId === noteIdOrNotifId || notif.identifier === noteIdOrNotifId) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
    }
};

export const setupNotificationResponseListener = (
    callback: (noteId: string) => void
) => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const noteId = response.notification.request.content.data?.noteId as string;
        if (noteId) {
            callback(noteId);
        }
    });
    return subscription;
};

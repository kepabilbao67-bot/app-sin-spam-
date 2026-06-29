import { Platform } from 'react-native';
import { BlockedItem } from '../types';

async function getNotifications() {
  if (Platform.OS === 'web') return null;
  try { return await import('expo-notifications'); } catch { return null; }
}

if (Platform.OS !== 'web') {
  getNotifications().then(Notifications => {
    if (!Notifications) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch { return false; }
}

export async function sendBlockedNotification(item: BlockedItem): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const typeLabel = ({ call: 'Llamada', sms: 'SMS', email: 'Email' } as Record<string, string>)[item.type] ?? 'Mensaje';
    const categoryLabel = {
      telemarketing: 'Telemarketing',
      phishing: 'Phishing',
      scam: 'Estafa',
      robocall: 'Robot',
      unknown: 'Spam',
    }[item.category];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚫 ${typeLabel} bloqueado — ${categoryLabel}`,
        body: `${item.sender}${item.content ? ` · ${item.content.substring(0, 60)}` : ''} (${Math.round(item.confidence * 100)}% confianza)`,
        data: { itemId: item.id },
        sound: true,
      },
      trigger: null,
    });
  } catch { }
}

export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try { await Notifications.setBadgeCountAsync(count); } catch { }
}

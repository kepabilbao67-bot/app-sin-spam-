import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { BlockedItem } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendBlockedNotification(item: BlockedItem): Promise<void> {
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
}

export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS !== 'web') {
    await Notifications.setBadgeCountAsync(count);
  }
}

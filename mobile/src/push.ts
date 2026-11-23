import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { api, unwrap } from './api/client';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
export async function enablePush() {
  if (!Device.isDevice)
    throw new Error('Push requires a physical device / الإشعارات تحتاج جهاز حقيقي');
  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
  if (!projectId || projectId.startsWith('replace-'))
    throw new Error('Configure EXPO_PUBLIC_PROJECT_ID');
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Marketplace',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Push permission denied / تم رفض الإذن');
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return unwrap(
    await api.POST('/api/v1/devices', {
      body: { token, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' },
    }),
  );
}

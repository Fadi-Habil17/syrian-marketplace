import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { api, unwrap } from './api/client';

// Loading the Android push module in Expo Go puts its unsupported-feature error over every screen.
const notifications: typeof import('expo-notifications') | null =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ? null
    : require('expo-notifications');

notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
export async function enablePush() {
  if (!notifications)
    throw new Error('Push requires a development build / الإشعارات تحتاج نسخة تطوير');
  if (!Device.isDevice)
    throw new Error('Push requires a physical device / الإشعارات تحتاج جهاز حقيقي');
  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
  if (!projectId || projectId.startsWith('replace-'))
    throw new Error('Configure EXPO_PUBLIC_PROJECT_ID');
  if (Platform.OS === 'android')
    await notifications.setNotificationChannelAsync('orders', {
      name: 'Marketplace',
      importance: notifications.AndroidImportance.DEFAULT,
    });
  let permission = await notifications.getPermissionsAsync();
  if (permission.status !== 'granted') permission = await notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Push permission denied / تم رفض الإذن');
  const token = (await notifications.getExpoPushTokenAsync({ projectId })).data;
  return unwrap(
    await api.POST('/api/v1/devices', {
      body: { token, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' },
    }),
  );
}

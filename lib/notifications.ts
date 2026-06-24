import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

// Foreground display behavior (banner + sound while the app is open).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Ask permission, get the Expo push token, and store it on the profile so the
// notify-parents edge function can reach this device.
//
// Note: remote push does NOT work in Expo Go (SDK 53+). Use a dev build
// (`eas build --profile development`) or a store build to test notifications.
export async function registerForPush(userId: string): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted && existing.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
  } catch (e) {
    // Non-fatal: the app works without push (e.g. in Expo Go).
    console.warn('Push registration skipped:', e);
  }
}

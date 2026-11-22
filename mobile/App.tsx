import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { messages, type Locale } from '@syrian-marketplace/i18n';

export default function App() {
  const [locale, setLocale] = useState<Locale>('ar');
  const text = messages[locale];
  const rtl = locale === 'ar';
  const direction = {
    writingDirection: rtl ? ('rtl' as const) : ('ltr' as const),
    textAlign: rtl ? ('right' as const) : ('left' as const),
  };
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ direction: rtl ? 'rtl' : 'ltr' }}>
          <Text style={[styles.badge, direction]}>B4F · {text.simulated}</Text>
          <Text accessibilityRole="header" style={[styles.title, direction]}>
            {text.title}
          </Text>
          <Text style={[styles.body, direction]}>{text.setupDescription}</Text>
          <Text style={[styles.body, direction]}>
            {text.freelance}
            {'\n'}
            {text.professionals}
            {'\n'}
            {text.homeStore}
          </Text>
          <Text style={[styles.body, direction]}>{text.setupOnly}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rtl ? 'English' : 'العربية'}
            onPress={() => setLocale(rtl ? 'en' : 'ar')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{rtl ? 'English' : 'العربية'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f8fa' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  badge: { color: '#00695c', fontSize: 16, fontWeight: '600', marginBottom: 18 },
  title: { color: '#132938', fontSize: 32, fontWeight: '700', marginBottom: 20 },
  body: { color: '#132938', fontSize: 18, lineHeight: 30, marginBottom: 20 },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#00695c',
    padding: 12,
    marginTop: 12,
  },
  buttonText: { color: '#ffffff', textAlign: 'center', fontSize: 18, fontWeight: '600' },
});

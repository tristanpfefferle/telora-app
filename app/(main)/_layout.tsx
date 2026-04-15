import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0A0A0F',
        },
        headerTintColor: '#FFFFFF',
        contentStyle: {
          backgroundColor: '#0A0A0F',
        },
        animation: 'slide_from_right',
      }}
    />
  );
}

import { Stack } from 'expo-router';

export default function AssistantsLayout() {
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
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
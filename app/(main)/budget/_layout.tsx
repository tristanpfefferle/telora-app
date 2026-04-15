import { Stack } from 'expo-router';

export default function BudgetLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0A0A0F',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="step-1"
        options={{
          title: 'Étape 1/7',
        }}
      />
      <Stack.Screen
        name="step-2"
        options={{
          title: 'Étape 2/7',
        }}
      />
      <Stack.Screen
        name="step-3"
        options={{
          title: 'Étape 3/7',
        }}
      />
      <Stack.Screen
        name="step-4"
        options={{
          title: 'Étape 4/7',
        }}
      />
      <Stack.Screen
        name="step-5"
        options={{
          title: 'Étape 5/7',
        }}
      />
      <Stack.Screen
        name="step-6"
        options={{
          title: 'Étape 6/7',
        }}
      />
      <Stack.Screen
        name="step-7"
        options={{
          title: 'Étape 7/7',
        }}
      />
    </Stack>
  );
}

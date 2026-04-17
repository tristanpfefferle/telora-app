import { Redirect } from 'expo-router';
import { useUserStore } from '../stores/userStore';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useUserStore();

  if (isLoading) {
    return null; // Le loader est géré par _layout.tsx
  }

  if (isAuthenticated) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useUserStore } from '../../stores/userStore';
import { authAPI } from '../../lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setLoading } = useUserStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoadingLocal] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoadingLocal(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);
      const { token, user, progress } = response.data;
      
      // Sauvegarder le token et les données dans le store
      useUserStore.getState().setToken(token);
      setUser(user);
      useUserStore.getState().setProgress(progress);
      setLoading(false);
      
      // Rediriger vers l'accueil
      router.replace('/(main)/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue');
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-12 justify-center">
          {/* Logo / Titre */}
          <View className="items-center mb-10">
            <Text className="text-5xl mb-4">💰</Text>
            <Text className="text-4xl font-heading text-primary text-center">
              Telora
            </Text>
            <Text className="text-textSecondary text-center mt-2">
              Ton éducation financière
            </Text>
          </View>

          {/* Formulaire */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={email}
                onChange={setEmail}
                placeholder="ton@email.ch"
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={error && !email ? 'Email requis' : undefined}
              />
              
              <Input
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                label="Mot de passe"
                secureTextEntry
                error={error && !password ? 'Mot de passe requis' : undefined}
              />

              {error && (
                <View className="bg-error bg-opacity-10 border border-error rounded-lg px-4 py-3">
                  <Text className="text-error text-sm">{error}</Text>
                </View>
              )}

              <Button
                onPress={handleLogin}
                loading={loading}
                className="w-full mt-4"
                size="lg"
              >
                Se connecter
              </Button>
            </CardContent>
          </Card>

          {/* Lien vers inscription */}
          <View className="items-center">
            <Text className="text-textSecondary text-center">
              Pas encore de compte ?
            </Text>
            <Button
              onPress={() => router.push('/(auth)/signup')}
              variant="ghost"
              className="mt-2"
            >
              Créer un compte
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

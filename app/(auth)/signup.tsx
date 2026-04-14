import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useUserStore } from '../../stores/userStore';
import { authAPI } from '../../lib/api';

export default function SignupScreen() {
  const router = useRouter();
  const { setUser, setLoading } = useUserStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoadingLocal] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !password) {
      setError('Email et mot de passe sont requis');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoadingLocal(true);
    setError('');

    try {
      const response = await authAPI.signup(email, password, firstName, lastName);
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
        <View className="flex-1 px-6 py-8 justify-center">
          {/* Titre */}
          <View className="items-center mb-8">
            <Text className="text-4xl font-heading text-primary text-center">
              Telora
            </Text>
            <Text className="text-textSecondary text-center mt-2">
              Crée ton compte gratuit
            </Text>
          </View>

          {/* Formulaire */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Inscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Input
                    value={firstName}
                    onChange={setFirstName}
                    placeholder="Prénom"
                    label="Prénom"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    value={lastName}
                    onChange={setLastName}
                    placeholder="Nom"
                    label="Nom"
                  />
                </View>
              </View>
              
              <Input
                value={email}
                onChange={setEmail}
                placeholder="ton@email.ch"
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Input
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                label="Mot de passe"
                secureTextEntry
              />
              
              <Input
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                label="Confirmer le mot de passe"
                secureTextEntry
              />

              {error && (
                <View className="bg-error bg-opacity-10 border border-error rounded-lg px-4 py-3">
                  <Text className="text-error text-sm">{error}</Text>
                </View>
              )}

              <Button
                onPress={handleSignup}
                loading={loading}
                className="w-full mt-4"
                size="lg"
              >
                Créer mon compte
              </Button>
            </CardContent>
          </Card>

          {/* Lien vers connexion */}
          <View className="items-center">
            <Text className="text-textSecondary text-center">
              Déjà un compte ?
            </Text>
            <Button
              onPress={() => router.back()}
              variant="ghost"
              className="mt-2"
            >
              Se connecter
            </Button>
          </View>

          {/* Disclaimer */}
          <View className="mt-8 px-4">
            <Text className="text-textMuted text-xs text-center">
              En créant un compte, tu acceptes nos Conditions d'utilisation et notre Politique de confidentialité.
            </Text>
            <Text className="text-textMuted text-xs text-center mt-2">
              Telora est un outil d'éducation financière, pas un conseiller en investissement.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

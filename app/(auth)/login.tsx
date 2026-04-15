import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useUserStore } from '../../stores/userStore';
import { authAPI } from '../../lib/api';
import { colors, spacing, borderRadius } from '../../lib/theme';

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
      
      useUserStore.getState().setToken(token);
      setUser(user);
      useUserStore.getState().setProgress(progress);
      setLoading(false);
      
      router.replace('/(main)/');
    } catch (err: any) {
      console.error('LOGIN ERROR:', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          baseURL: err.config?.baseURL,
        }
      });
      
      // Message d'erreur plus précis
      let errorMsg = 'Une erreur est survenue';
      if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Impossible de contacter le serveur. Vérifie ta connexion.';
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'La connexion a expiré. Réessaie.';
      } else if (err.response?.status === 401) {
        errorMsg = 'Email ou mot de passe incorrect';
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      
      setError(errorMsg);
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo / Titre */}
          <View style={styles.header}>
            <Text style={styles.logoEmoji}>💰</Text>
            <Text style={styles.title}>Telora</Text>
            <Text style={styles.subtitle}>Ton éducation financière</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.cardContainer}>
            <Card>
              <CardHeader>
                <CardTitle>Connexion</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.form}>
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
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <View style={styles.buttonContainer}>
                    <Button
                      onPress={handleLogin}
                      loading={loading}
                      size="lg"
                    >
                      Se connecter
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Lien vers inscription */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Pas encore de compte ?
            </Text>
            <Button
              onPress={() => router.push('/(auth)/signup')}
              variant="ghost"
            >
              Créer un compte
            </Button>
          </View>
          
          {/* Bouton de test réseau pour debug */}
          <TouchableOpacity
            onPress={() => router.push('/network-test')}
            style={styles.networkTestButton}
          >
            <Text style={styles.networkTestText}>
              🧪 Tester la connexion réseau
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl + spacing.xl,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cardContainer: {
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  signupContainer: {
    alignItems: 'center',
  },
  signupText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  networkTestButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  networkTestText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

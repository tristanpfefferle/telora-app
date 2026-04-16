import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useUserStore } from '../../stores/userStore';
import { authAPI } from '../../lib/api';
import { colors, spacing, borderRadius } from '../../lib/theme';

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
      
      useUserStore.getState().setToken(token);
      setUser(user);
      useUserStore.getState().setProgress(progress);
      setLoading(false);
      
      router.replace('/(main)');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue');
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
          {/* Titre */}
          <View style={styles.header}>
            <Text style={styles.title}>Telora</Text>
            <Text style={styles.subtitle}>Crée ton compte gratuit</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.cardContainer}>
            <Card>
              <CardHeader>
                <CardTitle>Inscription</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.form}>
                  <View style={styles.nameRow}>
                    <View style={styles.nameField}>
                      <Input
                        value={firstName}
                        onChange={setFirstName}
                        placeholder="Prénom"
                        label="Prénom"
                      />
                    </View>
                    <View style={styles.nameField}>
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
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <View style={styles.buttonContainer}>
                    <Button
                      onPress={handleSignup}
                      loading={loading}
                      size="lg"
                    >
                      Créer mon compte
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Lien vers connexion */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Déjà un compte ?
            </Text>
            <Button
              onPress={() => router.back()}
              variant="ghost"
            >
              Se connecter
            </Button>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              En créant un compte, tu acceptes nos Conditions d'utilisation et notre Politique de confidentialité.
            </Text>
            <Text style={[styles.disclaimerText, styles.disclaimerSubtext]}>
              Telora est un outil d'éducation financière, pas un conseiller en investissement.
            </Text>
          </View>
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
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
  nameRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  nameField: {
    flex: 1,
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
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  disclaimer: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  disclaimerText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  disclaimerSubtext: {
    marginTop: spacing.sm,
  },
});

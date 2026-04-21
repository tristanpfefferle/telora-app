import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../../stores/userStore';
import { authAPI, type User } from '../../../lib/api';
import { colors, borderRadius, spacing } from '../../../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function ProfileScreen() {
  const user = useUserStore((s: { user: User | null }) => s.user);
  const setUser = useUserStore((s: { setUser: (u: User | null) => void }) => s.setUser);
  const logout = useUserStore((s: { logout: () => void }) => s.logout);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const enterEdit = useCallback(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setNewPassword('');
    setConfirmPassword('');
    setEditing(true);
  }, [user]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setNewPassword('');
    setConfirmPassword('');
  }, []);

  const saveProfile = useCallback(async () => {
    // Validation mot de passe
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Erreur', 'L\'email est obligatoire');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (firstName.trim() !== (user?.firstName || '')) payload.firstName = firstName.trim();
      if (lastName.trim() !== (user?.lastName || '')) payload.lastName = lastName.trim();
      if (email.trim() !== user?.email) payload.email = email.trim();
      if (newPassword) payload.password = newPassword;

      if (Object.keys(payload).length === 0) {
        setEditing(false);
        setSaving(false);
        return;
      }

      const res = await authAPI.updateProfile(payload);
      setUser(res.data.user as User);
      setEditing(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('✅ Profil mis à jour', 'Tes informations ont été sauvegardées.');
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Erreur lors de la mise à jour';
      Alert.alert('Erreur', detail);
    } finally {
      setSaving(false);
    }
  }, [user, firstName, lastName, email, newPassword, confirmPassword, setUser]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Veux-tu vraiment te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  }, [logout]);

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.firstName ? user.firstName[0].toUpperCase() : '👤'}
              </Text>
            </View>
            <Text style={styles.title}>Mon Profil</Text>
            <Text style={styles.subtitle}>
              Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-CH', {
                month: 'long', year: 'numeric',
              })}
            </Text>
          </View>

          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <View style={styles.cardHeaderRow}>
                <CardTitle>Informations personnelles</CardTitle>
                {!editing && (
                  <TouchableOpacity onPress={enterEdit} style={styles.editLink}>
                    <Text style={styles.editLinkText}>Modifier</Text>
                  </TouchableOpacity>
                )}
              </View>
            </CardHeader>
            <CardContent>
              {editing ? (
                <View style={styles.form}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Prénom</Text>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Ton prénom"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Nom</Text>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Ton nom"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="ton@email.ch"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.sectionHint}>Changer le mot de passe (optionnel)</Text>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
                    <TextInput
                      style={styles.input}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Min. 8 caractères"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                    />
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Retape le mot de passe"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.formActions}>
                    <TouchableOpacity
                      onPress={cancelEdit}
                      style={styles.cancelBtn}
                      disabled={saving}
                    >
                      <Text style={styles.cancelBtnText}>Annuler</Text>
                    </TouchableOpacity>
                    <Button
                      onPress={saveProfile}
                      disabled={saving}
                      size="md"
                    >
                      {saving ? 'Sauvegarde...' : 'Enregistrer'}
                    </Button>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRows}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Prénom</Text>
                    <Text style={styles.infoValue}>{user.firstName || '—'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nom</Text>
                    <Text style={styles.infoValue}>{user.lastName || '—'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mot de passe</Text>
                    <Text style={styles.infoValue}>••••••••</Text>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Déconnexion */}
          <Card style={styles.dangerCard}>
            <CardContent>
              <Button
                onPress={handleLogout}
                variant="outline"
                size="lg"
              >
                Se déconnecter
              </Button>
            </CardContent>
          </Card>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  editLink: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  editLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  infoRows: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dangerCard: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  spacer: {
    height: 60,
  },
});
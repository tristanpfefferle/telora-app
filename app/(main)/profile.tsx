     1|import React, { useState, useCallback } from 'react';
     2|import {
     3|  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput,
     4|  KeyboardAvoidingView, Platform, ActivityIndicator,
     5|} from 'react-native';
     6|import { SafeAreaView } from 'react-native-safe-area-context';
     7|import { useUserStore } from '../../stores/userStore';
     8|import { authAPI, type User } from '../../lib/api';
     9|import { colors, borderRadius, spacing } from '../../lib/theme';
    10|import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
    11|import { Button } from '../../components/ui/Button';
    12|
    13|export default function ProfileScreen() {
    14|  const user = useUserStore((s: { user: User | null }) => s.user);
    15|  const setUser = useUserStore((s: { setUser: (u: User | null) => void }) => s.setUser);
    16|  const logout = useUserStore((s: { logout: () => void }) => s.logout);
    17|
    18|  const [editing, setEditing] = useState(false);
    19|  const [saving, setSaving] = useState(false);
    20|  const [firstName, setFirstName] = useState(user?.firstName || '');
    21|  const [lastName, setLastName] = useState(user?.lastName || '');
    22|  const [email, setEmail] = useState(user?.email || '');
    23|  const [newPassword, setNewPassword] = useState('');
    24|  const [confirmPassword, setConfirmPassword] = useState('');
    25|
    26|  const enterEdit = useCallback(() => {
    27|    setFirstName(user?.firstName || '');
    28|    setLastName(user?.lastName || '');
    29|    setEmail(user?.email || '');
    30|    setNewPassword('');
    31|    setConfirmPassword('');
    32|    setEditing(true);
    33|  }, [user]);
    34|
    35|  const cancelEdit = useCallback(() => {
    36|    setEditing(false);
    37|    setNewPassword('');
    38|    setConfirmPassword('');
    39|  }, []);
    40|
    41|  const saveProfile = useCallback(async () => {
    42|    // Validation mot de passe
    43|    if (newPassword && newPassword !== confirmPassword) {
    44|      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
    45|      return;
    46|    }
    47|    if (newPassword && newPassword.length < 8) {
    48|      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
    49|      return;
    50|    }
    51|    if (!email.trim()) {
    52|      Alert.alert('Erreur', 'L\'email est obligatoire');
    53|      return;
    54|    }
    55|
    56|    setSaving(true);
    57|    try {
    58|      const payload: Record<string, string> = {};
    59|      if (firstName.trim() !== (user?.firstName || '')) payload.firstName = firstName.trim();
    60|      if (lastName.trim() !== (user?.lastName || '')) payload.lastName = lastName.trim();
    61|      if (email.trim() !== user?.email) payload.email = email.trim();
    62|      if (newPassword) payload.password = newPassword;
    63|
    64|      if (Object.keys(payload).length === 0) {
    65|        setEditing(false);
    66|        setSaving(false);
    67|        return;
    68|      }
    69|
    70|      const res = await authAPI.updateProfile(payload);
    71|      setUser(res.data.user as User);
    72|      setEditing(false);
    73|      setNewPassword('');
    74|      setConfirmPassword('');
    75|      Alert.alert('✅ Profil mis à jour', 'Tes informations ont été sauvegardées.');
    76|    } catch (err: any) {
    77|      const detail = err?.response?.data?.detail || 'Erreur lors de la mise à jour';
    78|      Alert.alert('Erreur', detail);
    79|    } finally {
    80|      setSaving(false);
    81|    }
    82|  }, [user, firstName, lastName, email, newPassword, confirmPassword, setUser]);
    83|
    84|  const handleLogout = useCallback(() => {
    85|    Alert.alert(
    86|      'Déconnexion',
    87|      'Veux-tu vraiment te déconnecter ?',
    88|      [
    89|        { text: 'Annuler', style: 'cancel' },
    90|        {
    91|          text: 'Se déconnecter',
    92|          style: 'destructive',
    93|          onPress: () => logout(),
    94|        },
    95|      ]
    96|    );
    97|  }, [logout]);
    98|
    99|  if (!user) {
   100|    return (
   101|      <View style={styles.center}>
   102|        <ActivityIndicator size="large" color={colors.primary} />
   103|      </View>
   104|    );
   105|  }
   106|
   107|  return (
   108|    <SafeAreaView style={styles.safeArea}>
   109|      <KeyboardAvoidingView
   110|        style={styles.container}
   111|        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
   112|      >
   113|        <ScrollView
   114|          style={styles.scroll}
   115|          contentContainerStyle={styles.content}
   116|          keyboardShouldPersistTaps="handled"
   117|        >
   118|          {/* Header */}
   119|          <View style={styles.header}>
   120|            <View style={styles.avatar}>
   121|              <Text style={styles.avatarText}>
   122|                {user.firstName ? user.firstName[0].toUpperCase() : '👤'}
   123|              </Text>
   124|            </View>
   125|            <Text style={styles.title}>Mon Profil</Text>
   126|            <Text style={styles.subtitle}>
   127|              Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-CH', {
   128|                month: 'long', year: 'numeric',
   129|              })}
   130|            </Text>
   131|          </View>
   132|
   133|          {/* Informations personnelles */}
   134|          <Card>
   135|            <CardHeader>
   136|              <View style={styles.cardHeaderRow}>
   137|                <CardTitle>Informations personnelles</CardTitle>
   138|                {!editing && (
   139|                  <TouchableOpacity onPress={enterEdit} style={styles.editLink}>
   140|                    <Text style={styles.editLinkText}>Modifier</Text>
   141|                  </TouchableOpacity>
   142|                )}
   143|              </View>
   144|            </CardHeader>
   145|            <CardContent>
   146|              {editing ? (
   147|                <View style={styles.form}>
   148|                  <View style={styles.fieldGroup}>
   149|                    <Text style={styles.fieldLabel}>Prénom</Text>
   150|                    <TextInput
   151|                      style={styles.input}
   152|                      value={firstName}
   153|                      onChangeText={setFirstName}
   154|                      placeholder="Ton prénom"
   155|                      placeholderTextColor={colors.textMuted}
   156|                      autoCapitalize="words"
   157|                    />
   158|                  </View>
   159|                  <View style={styles.fieldGroup}>
   160|                    <Text style={styles.fieldLabel}>Nom</Text>
   161|                    <TextInput
   162|                      style={styles.input}
   163|                      value={lastName}
   164|                      onChangeText={setLastName}
   165|                      placeholder="Ton nom"
   166|                      placeholderTextColor={colors.textMuted}
   167|                      autoCapitalize="words"
   168|                    />
   169|                  </View>
   170|                  <View style={styles.fieldGroup}>
   171|                    <Text style={styles.fieldLabel}>Email</Text>
   172|                    <TextInput
   173|                      style={styles.input}
   174|                      value={email}
   175|                      onChangeText={setEmail}
   176|                      placeholder="ton@email.ch"
   177|                      placeholderTextColor={colors.textMuted}
   178|                      keyboardType="email-address"
   179|                      autoCapitalize="none"
   180|                    />
   181|                  </View>
   182|
   183|                  <View style={styles.divider} />
   184|
   185|                  <Text style={styles.sectionHint}>Changer le mot de passe (optionnel)</Text>
   186|                  <View style={styles.fieldGroup}>
   187|                    <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
   188|                    <TextInput
   189|                      style={styles.input}
   190|                      value={newPassword}
   191|                      onChangeText={setNewPassword}
   192|                      placeholder="Min. 8 caractères"
   193|                      placeholderTextColor={colors.textMuted}
   194|                      secureTextEntry
   195|                    />
   196|                  </View>
   197|                  <View style={styles.fieldGroup}>
   198|                    <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
   199|                    <TextInput
   200|                      style={styles.input}
   201|                      value={confirmPassword}
   202|                      onChangeText={setConfirmPassword}
   203|                      placeholder="Retape le mot de passe"
   204|                      placeholderTextColor={colors.textMuted}
   205|                      secureTextEntry
   206|                    />
   207|                  </View>
   208|
   209|                  <View style={styles.formActions}>
   210|                    <TouchableOpacity
   211|                      onPress={cancelEdit}
   212|                      style={styles.cancelBtn}
   213|                      disabled={saving}
   214|                    >
   215|                      <Text style={styles.cancelBtnText}>Annuler</Text>
   216|                    </TouchableOpacity>
   217|                    <Button
   218|                      onPress={saveProfile}
   219|                      disabled={saving}
   220|                      size="md"
   221|                    >
   222|                      {saving ? 'Sauvegarde...' : 'Enregistrer'}
   223|                    </Button>
   224|                  </View>
   225|                </View>
   226|              ) : (
   227|                <View style={styles.infoRows}>
   228|                  <View style={styles.infoRow}>
   229|                    <Text style={styles.infoLabel}>Prénom</Text>
   230|                    <Text style={styles.infoValue}>{user.firstName || '—'}</Text>
   231|                  </View>
   232|                  <View style={styles.infoRow}>
   233|                    <Text style={styles.infoLabel}>Nom</Text>
   234|                    <Text style={styles.infoValue}>{user.lastName || '—'}</Text>
   235|                  </View>
   236|                  <View style={styles.infoRow}>
   237|                    <Text style={styles.infoLabel}>Email</Text>
   238|                    <Text style={styles.infoValue}>{user.email}</Text>
   239|                  </View>
   240|                  <View style={styles.infoRow}>
   241|                    <Text style={styles.infoLabel}>Mot de passe</Text>
   242|                    <Text style={styles.infoValue}>••••••••</Text>
   243|                  </View>
   244|                </View>
   245|              )}
   246|            </CardContent>
   247|          </Card>
   248|
   249|          {/* Déconnexion */}
   250|          <Card style={styles.dangerCard}>
   251|            <CardContent>
   252|              <Button
   253|                onPress={handleLogout}
   254|                variant="outline"
   255|                size="lg"
   256|              >
   257|                Se déconnecter
   258|              </Button>
   259|            </CardContent>
   260|          </Card>
   261|
   262|          <View style={styles.spacer} />
   263|        </ScrollView>
   264|      </KeyboardAvoidingView>
   265|    </SafeAreaView>
   266|  );
   267|}
   268|
   269|const styles = StyleSheet.create({
   270|  safeArea: {
   271|    flex: 1,
   272|    backgroundColor: colors.background,
   273|  },
   274|  container: {
   275|    flex: 1,
   276|    backgroundColor: colors.background,
   277|  },
   278|  scroll: {
   279|    flex: 1,
   280|  },
   281|  content: {
   282|    paddingHorizontal: spacing.xl,
   283|    paddingVertical: spacing.xxl,
   284|    gap: spacing.xl,
   285|  },
   286|  center: {
   287|    flex: 1,
   288|    justifyContent: 'center',
   289|    alignItems: 'center',
   290|    backgroundColor: colors.background,
   291|  },
   292|  header: {
   293|    alignItems: 'center',
   294|    gap: spacing.sm,
   295|    marginBottom: spacing.md,
   296|  },
   297|  avatar: {
   298|    width: 72,
   299|    height: 72,
   300|    borderRadius: 36,
   301|    backgroundColor: colors.surface,
   302|    borderWidth: 2,
   303|    borderColor: colors.primary,
   304|    justifyContent: 'center',
   305|    alignItems: 'center',
   306|    marginBottom: spacing.sm,
   307|  },
   308|  avatarText: {
   309|    fontSize: 28,
   310|    fontWeight: '700',
   311|    color: colors.primary,
   312|  },
   313|  title: {
   314|    fontSize: 24,
   315|    fontWeight: '700',
   316|    color: colors.textPrimary,
   317|  },
   318|  subtitle: {
   319|    fontSize: 14,
   320|    color: colors.textMuted,
   321|  },
   322|  cardHeaderRow: {
   323|    flexDirection: 'row',
   324|    justifyContent: 'space-between',
   325|    alignItems: 'center',
   326|    width: '100%',
   327|  },
   328|  editLink: {
   329|    paddingVertical: spacing.xs,
   330|    paddingHorizontal: spacing.sm,
   331|  },
   332|  editLinkText: {
   333|    color: colors.primary,
   334|    fontSize: 14,
   335|    fontWeight: '600',
   336|  },
   337|  form: {
   338|    gap: spacing.lg,
   339|  },
   340|  fieldGroup: {
   341|    gap: spacing.xs,
   342|  },
   343|  fieldLabel: {
   344|    fontSize: 13,
   345|    fontWeight: '600',
   346|    color: colors.textSecondary,
   347|  },
   348|  input: {
   349|    backgroundColor: colors.background,
   350|    borderWidth: 1,
   351|    borderColor: colors.border,
   352|    borderRadius: borderRadius.sm,
   353|    paddingHorizontal: 14,
   354|    paddingVertical: 12,
   355|    fontSize: 16,
   356|    color: colors.textPrimary,
   357|  },
   358|  divider: {
   359|    height: 1,
   360|    backgroundColor: colors.border,
   361|    marginVertical: spacing.xs,
   362|  },
   363|  sectionHint: {
   364|    fontSize: 13,
   365|    fontWeight: '500',
   366|    color: colors.textMuted,
   367|  },
   368|  formActions: {
   369|    flexDirection: 'row',
   370|    justifyContent: 'flex-end',
   371|    alignItems: 'center',
   372|    gap: spacing.md,
   373|    marginTop: spacing.sm,
   374|  },
   375|  cancelBtn: {
   376|    paddingHorizontal: 16,
   377|    paddingVertical: 10,
   378|    borderRadius: borderRadius.sm,
   379|  },
   380|  cancelBtnText: {
   381|    color: colors.textSecondary,
   382|    fontSize: 14,
   383|    fontWeight: '600',
   384|  },
   385|  infoRows: {
   386|    gap: spacing.md,
   387|  },
   388|  infoRow: {
   389|    flexDirection: 'row',
   390|    justifyContent: 'space-between',
   391|    alignItems: 'center',
   392|    paddingVertical: spacing.xs,
   393|  },
   394|  infoLabel: {
   395|    fontSize: 14,
   396|    color: colors.textSecondary,
   397|  },
   398|  infoValue: {
   399|    fontSize: 14,
   400|    color: colors.textPrimary,
   401|    fontWeight: '500',
   402|  },
   403|  dangerCard: {
   404|    borderColor: colors.error,
   405|    borderWidth: 1,
   406|  },
   407|  spacer: {
   408|    height: 60,
   409|  },
   410|});
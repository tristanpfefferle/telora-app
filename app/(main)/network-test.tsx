/**
 * Écran de test de connexion réseau
 * Pour debugguer pourquoi l'app n'arrive pas à contacter le backend
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors, borderRadius } from '../../lib/theme';

export default function NetworkTestScreen() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const logs: string[] = [];
    
    const API_URL = 'http://187.124.218.190:8001';
    
    logs.push('=== DÉBUT DES TESTS ===\n');
    logs.push(`URL testée: ${API_URL}\n`);
    logs.push(`Date: ${new Date().toISOString()}\n`);
    logs.push('');
    
    // Test 1: Fetch simple
    logs.push('📡 Test 1: Fetch vers /api/health');
    try {
      const response = await fetch(`${API_URL}/api/health`);
      logs.push(`   Status: ${response.status}`);
      logs.push(`   OK: ${response.ok}`);
      const data = await response.json();
      logs.push(`   Réponse: ${JSON.stringify(data)}`);
      logs.push('   ✅ SUCCÈS\n');
    } catch (err: any) {
      logs.push(`   ❌ ÉCHEC: ${err.message}`);
      logs.push(`   Code: ${err.code || 'N/A'}`);
      logs.push(`   Type: ${err.name || 'N/A'}`);
      logs.push('');
    }
    
    // Test 2: Login avec fetch
    logs.push('📡 Test 2: POST vers /api/auth/login');
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'tristan@telora.ch', password: 'test1234' }),
      });
      logs.push(`   Status: ${response.status}`);
      logs.push(`   OK: ${response.ok}`);
      const data = await response.json();
      logs.push(`   Réponse: ${JSON.stringify(data).substring(0, 100)}...`);
      logs.push('   ✅ SUCCÈS\n');
    } catch (err: any) {
      logs.push(`   ❌ ÉCHEC: ${err.message}`);
      logs.push(`   Code: ${err.code || 'N/A'}`);
      logs.push(`   Type: ${err.name || 'N/A'}`);
      logs.push('');
    }
    
    // Test 3: Axios
    logs.push('📡 Test 3: Axios vers /api/health');
    try {
      const axios = require('axios').default;
      const response = await axios.get(`${API_URL}/api/health`);
      logs.push(`   Status: ${response.status}`);
      logs.push(`   Data: ${JSON.stringify(response.data)}`);
      logs.push('   ✅ SUCCÈS\n');
    } catch (err: any) {
      logs.push(`   ❌ ÉCHEC: ${err.message}`);
      logs.push(`   Code: ${err.code || 'N/A'}`);
      logs.push(`   Config URL: ${err.config?.url}`);
      logs.push(`   Config baseURL: ${err.config?.baseURL}`);
      logs.push('');
    }
    
    logs.push('=== FIN DES TESTS ===');
    
    setResults(logs);
    setLoading(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        🧪 Test Réseau
      </Text>
      
      <Text style={{ color: colors.textMuted, marginBottom: 20 }}>
        Ce test vérifie si l'app peut contacter le backend Telora.
      </Text>
      
      <TouchableOpacity
        onPress={runTests}
        disabled={loading}
        style={{
          backgroundColor: loading ? colors.textMuted : colors.accent,
          padding: 16,
          borderRadius: borderRadius.lg,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            Lancer les tests
          </Text>
        )}
      </TouchableOpacity>
      
      {results.length > 0 && (
        <View style={{ backgroundColor: '#1a1a2e', padding: 16, borderRadius: borderRadius.md }}>
          <Text style={{ color: '#00ff00', fontFamily: 'monospace', fontSize: 12 }}>
            {results.join('\n')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

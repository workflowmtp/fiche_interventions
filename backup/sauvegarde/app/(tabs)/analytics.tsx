import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChartBar as BarChart, ChartPie as PieChart, ChartLine as LineChart } from 'lucide-react-native';

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    },
    content: {
      padding: 16,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      color: isDark ? '#ffffff' : '#000000',
    },
    card: {
      backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      ...Platform.select({
        web: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      }),
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: isDark ? '#ffffff' : '#000000',
    },
    chartPlaceholder: {
      height: 200,
      borderRadius: 8,
      backgroundColor: isDark ? '#404040' : '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 16,
      color: isDark ? '#cccccc' : '#666666',
      marginTop: 8,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statLabel: {
      fontSize: 16,
      color: isDark ? '#cccccc' : '#666666',
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#000000',
    },
    emptyState: {
      padding: 24,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: isDark ? '#cccccc' : '#666666',
      textAlign: 'center',
      marginTop: 8,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Analyses</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Production journalière</Text>
          <View style={styles.chartPlaceholder}>
            <BarChart size={48} color={isDark ? '#cccccc' : '#666666'} />
            <Text style={styles.placeholderText}>Aucune donnée disponible</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Répartition des tâches</Text>
          <View style={styles.chartPlaceholder}>
            <PieChart size={48} color={isDark ? '#cccccc' : '#666666'} />
            <Text style={styles.placeholderText}>Aucune donnée disponible</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tendances de production</Text>
          <View style={styles.chartPlaceholder}>
            <LineChart size={48} color={isDark ? '#cccccc' : '#666666'} />
            <Text style={styles.placeholderText}>Aucune donnée disponible</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statistiques globales</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Tâches totales</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Tâches terminées</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Tâches en cours</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Durée moyenne des tâches</Text>
            <Text style={styles.statValue}>0 min</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Production totale</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
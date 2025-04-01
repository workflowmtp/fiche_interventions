import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'red',
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      color: isDark ? '#ffffff' : '#000000',
    },
    cardText: {
      fontSize: 16,
      color: isDark ? '#cccccc' : '#666666',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Tableau de bord</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tâches actives</Text>
          <Text style={styles.cardText}>Aucune tâche active</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statistiques du jour</Text>
          <Text style={styles.cardText}>Tâches totales : 0</Text>
          <Text style={styles.cardText}>Tâches terminées : 0</Text>
          <Text style={styles.cardText}>Durée moyenne des tâches : 0 min</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activité récente</Text>
          <Text style={styles.cardText}>Aucune activité récente</Text>
        </View>
      </View>
    </ScrollView>
  );
}
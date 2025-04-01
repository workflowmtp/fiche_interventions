import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { QrCode, Camera, Upload } from 'lucide-react-native';

export default function ScanScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [scanning, setScanning] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    },
    content: {
      flex: 1,
      padding: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 24,
      color: isDark ? '#ffffff' : '#000000',
      textAlign: 'center',
    },
    scanArea: {
      width: '100%',
      aspectRatio: 1,
      maxWidth: 300,
      backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
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
    scanIcon: {
      marginBottom: 16,
    },
    scanText: {
      fontSize: 16,
      color: isDark ? '#cccccc' : '#666666',
      textAlign: 'center',
      maxWidth: 250,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    button: {
      backgroundColor: '#007AFF',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    notAvailableText: {
      fontSize: 16,
      color: isDark ? '#cccccc' : '#666666',
      textAlign: 'center',
      marginTop: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Scanner un code QR</Text>
        
        <View style={styles.scanArea}>
          <QrCode size={64} color={isDark ? '#cccccc' : '#666666'} style={styles.scanIcon} />
          <Text style={styles.scanText}>
            {scanning 
              ? "Placez un code QR dans la zone de scan" 
              : "Appuyez sur le bouton pour scanner un code QR"}
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => setScanning(!scanning)}>
            <Camera size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {scanning ? "Arrêter" : "Scanner"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button}>
            <Upload size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Importer</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.notAvailableText}>
          Note: La fonctionnalité de scan n'est pas disponible sur le web.
          Utilisez l'application mobile pour scanner des codes QR.
        </Text>
      </View>
    </View>
  );
}
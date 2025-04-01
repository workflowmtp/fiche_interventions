import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Modal, TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Clock, Bell, Database, FileText, Languages, CircleHelp as HelpCircle, X } from 'lucide-react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SettingsModal = ({ visible, onClose, title, children }: ModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: isDark ? '#2d2d2d' : '#ffffff' }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={[
              styles.modalTitle,
              { color: isDark ? '#ffffff' : '#000000' }
            ]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
};

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [currentModal, setCurrentModal] = useState<string | null>(null);
  
  const [defaultDuration, setDefaultDuration] = useState('30');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [notificationVibration, setNotificationVibration] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [exportFormat, setExportFormat] = useState('csv');
  const [language, setLanguage] = useState('en');

  const SettingItem = ({ 
    icon, 
    title, 
    description, 
    action 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description?: string;
    action?: React.ReactNode;
  }) => (
    <View style={[styles.settingItem, { borderColor: isDark ? '#333333' : '#e0e0e0' }]}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          {title}
        </Text>
        {description && (
          <Text style={[styles.settingDescription, { color: isDark ? '#cccccc' : '#666666' }]}>
            {description}
          </Text>
        )}
      </View>
      {action}
    </View>
  );

  const renderModalContent = () => {
    switch (currentModal) {
      case 'duration':
        return (
          <View style={styles.modalBody}>
            <Text style={[styles.modalLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
              Default Task Duration (minutes)
            </Text>
            <TextInput
              style={[styles.modalInput, {
                backgroundColor: isDark ? '#404040' : '#f0f0f0',
                color: isDark ? '#ffffff' : '#000000'
              }]}
              value={defaultDuration}
              onChangeText={setDefaultDuration}
              keyboardType="numeric"
              placeholder="Enter duration"
              placeholderTextColor={isDark ? '#999999' : '#666666'}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setCurrentModal(null)}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        );

      case 'notifications':
        return (
          <View style={styles.modalBody}>
            <View style={styles.modalOption}>
              <Text style={[styles.modalLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
                Enable Notifications
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            <View style={styles.modalOption}>
              <Text style={[styles.modalLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
                Sound
              </Text>
              <Switch
                value={notificationSound}
                onValueChange={setNotificationSound}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={notificationSound ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            <View style={styles.modalOption}>
              <Text style={[styles.modalLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
                Vibration
              </Text>
              <Switch
                value={notificationVibration}
                onValueChange={setNotificationVibration}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={notificationVibration ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          </View>
        );

      case 'backup':
        return (
          <View style={styles.modalBody}>
            <View style={styles.modalOption}>
              <Text style={[styles.modalLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
                Automatic Backup
              </Text>
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={autoBackup ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            <Text style={[styles.modalLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
              Backup Frequency
            </Text>
            {['daily', 'weekly', 'monthly'].map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.radioOption,
                  backupFrequency === freq && styles.radioOptionSelected
                ]}
                onPress={() => setBackupFrequency(freq)}
              >
                <Text style={[
                  styles.radioOptionText,
                  { color: isDark ? '#ffffff' : '#000000' }
                ]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'export':
        return (
          <View style={styles.modalBody}>
            <Text style={[styles.modalLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
              Export Format
            </Text>
            {['csv', 'excel', 'json'].map((format) => (
              <TouchableOpacity
                key={format}
                style={[
                  styles.radioOption,
                  exportFormat === format && styles.radioOptionSelected
                ]}
                onPress={() => setExportFormat(format)}
              >
                <Text style={[
                  styles.radioOptionText,
                  { color: isDark ? '#ffffff' : '#000000' }
                ]}>
                  {format.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'language':
        return (
          <View style={styles.modalBody}>
            <Text style={[styles.modalLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
              Select Language
            </Text>
            {[
              { code: 'en', name: 'English' },
              { code: 'fr', name: 'Français' },
              { code: 'es', name: 'Español' },
              { code: 'de', name: 'Deutsch' }
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.radioOption,
                  language === lang.code && styles.radioOptionSelected
                ]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text style={[
                  styles.radioOptionText,
                  { color: isDark ? '#ffffff' : '#000000' }
                ]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'help':
        return (
          <View style={styles.modalBody}>
            <Text style={[styles.modalText, { color: isDark ? '#ffffff' : '#000000' }]}>
              Need help? Contact our support team:
            </Text>
            <Text style={[styles.modalText, { color: isDark ? '#ffffff' : '#000000' }]}>
              Email: support@timetracker.com
            </Text>
            <Text style={[styles.modalText, { color: isDark ? '#ffffff' : '#000000' }]}>
              Phone: +1 (555) 123-4567
            </Text>
            <Text style={[styles.modalText, { color: isDark ? '#ffffff' : '#000000', marginTop: 16 }]}>
              Documentation and FAQs:
            </Text>
            <TouchableOpacity style={styles.modalButton}>
              <Text style={styles.modalButtonText}>View Documentation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { marginTop: 8 }]}>
              <Text style={styles.modalButtonText}>View FAQs</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.header, { color: isDark ? '#ffffff' : '#000000' }]}>
        Paramètres
      </Text>

      <View style={[styles.section, { backgroundColor: isDark ? '#2d2d2d' : '#ffffff' }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Apparence
        </Text>
        <SettingItem
          icon={isDark ? <Moon color="#ffffff" size={24} /> : <Sun color="#000000" size={24} />}
          title="Mode sombre"
          description="Basculer entre le thème clair et sombre"
          action={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDark ? '#007AFF' : '#f4f3f4'}
            />
          }
        />
      </View>

      <View style={[styles.section, { backgroundColor: isDark ? '#2d2d2d' : '#ffffff' }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Paramètres des tâches
        </Text>
        <SettingItem
          icon={<Clock color={isDark ? '#ffffff' : '#000000'} size={24} />}
          title="Durée par défaut"
          description={`Actuel : ${defaultDuration} minutes`}
          action={
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setCurrentModal('duration')}
            >
              <Text style={styles.buttonText}>Configurer</Text>
            </TouchableOpacity>
          }
        />
        <SettingItem
          icon={<Bell color={isDark ? '#ffffff' : '#000000'} size={24} />}
          title="Notifications"
          description={notificationsEnabled ? 'Activées' : 'Désactivées'}
          action={
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setCurrentModal('notifications')}
            >
              <Text style={styles.buttonText}>Configurer</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <View style={[styles.section, { backgroundColor: isDark ? '#2d2d2d' : '#ffffff' }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Gestion des données
        </Text>
        <SettingItem
          icon={<Database color={isDark ? '#ffffff' : '#000000'} size={24} />}
          title="Sauvegarde"
          description={autoBackup ? `Sauvegarde auto : ${backupFrequency === 'daily' ? 'quotidienne' : backupFrequency === 'weekly' ? 'hebdomadaire' : 'mensuelle'}` : 'Sauvegarde auto : Désactivée'}
          action={
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setCurrentModal('backup')}
            >
              <Text style={styles.buttonText}>Gérer</Text>
            </TouchableOpacity>
          }
        />
        <SettingItem
          icon={<FileText color={isDark ? '#ffffff' : '#000000'} size={24} />}
          title="Format d'export"
          description={`Actuel : ${exportFormat.toUpperCase()}`}
          action={
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setCurrentModal('export')}
            >
              <Text style={styles.buttonText}>Configurer</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <View style={[styles.section, { backgroundColor: isDark ? '#2d2d2d' : '#ffffff' }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Général
        </Text>
        <SettingItem
          icon={<Languages color={isDark ? '#ffffff' : '#000000'} size={24} />}
          title="Langue"
          description={language === 'en' ? 'Anglais' : language === 'fr' ? 'Français' : language === 'es' ? 'Espagnol' : 'Allemand'}
          action={
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setCurrentModal('language')}
            >
              <Text style={styles.buttonText}>Sélectionner</Text>
            </TouchableOpacity>
          }
        />
        <SettingItem
          icon={<HelpCircle color={isDark ? '#ffffff' : '#000000'} size={24} />}
          title="Aide & Support"
          description="Obtenir de l'aide et contacter le support"
          action={
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setCurrentModal('help')}
            >
              <Text style={styles.buttonText}>Ouvrir</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.version, { color: isDark ? '#cccccc' : '#666666' }]}>
          Version 1.0.0
        </Text>
      </View>

      <SettingsModal
        visible={currentModal !== null}
        onClose={() => setCurrentModal(null)}
        title={
          currentModal === 'duration' ? 'Durée par défaut' :
          currentModal === 'notifications' ? 'Notifications' :
          currentModal === 'backup' ? 'Sauvegarde des données' :
          currentModal === 'export' ? 'Format d\'export' :
          currentModal === 'language' ? 'Langue' :
          currentModal === 'help' ? 'Aide & Support' :
          ''
        }
      >
        {renderModalContent()}
      </SettingsModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    padding: 16,
  },
  version: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 8,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  modalInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  radioOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  radioOptionSelected: {
    backgroundColor: '#007AFF',
  },
  radioOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
  },
});
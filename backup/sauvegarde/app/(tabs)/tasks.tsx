import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, Modal, FlatList } from 'react-native';
import { Play, Pause, CircleStop as StopCircle, Search, Filter, Download, Calendar, Clock, Package, Scale, X, Users, CircleAlert as AlertCircle, ChevronDown, ListPlus } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProductionEntry {
  timestamp: Date;
  quantity: number;
  unit: string;
}

interface Task {
  id: string;
  name: string;
  operator: string;
  operatorsCount: number;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'active' | 'paused' | 'completed';
  productionEntries: ProductionEntry[];
  totalQuantity: number;
  unit: string;
}

type StatusFilter = 'all' | 'active' | 'paused' | 'completed';

const STORAGE_KEY = 'operators_list';
const TASKS_STORAGE_KEY = 'predefined_tasks';

export default function TasksScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskName, setTaskName] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [operatorsCount, setOperatorsCount] = useState('1');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [exportLoading, setExportLoading] = useState(false);
  const [currentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [isEditingLastEntry, setIsEditingLastEntry] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [operators, setOperators] = useState<string[]>([]);
  const [showOperatorsModal, setShowOperatorsModal] = useState(false);
  const [newOperator, setNewOperator] = useState('');
  const [operatorSearchQuery, setOperatorSearchQuery] = useState('');
  
  // Nouvelles variables pour les tâches pré-enregistrées
  const [predefinedTasks, setPredefinedTasks] = useState<string[]>([]);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [newPredefinedTask, setNewPredefinedTask] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  useEffect(() => {
    loadOperators();
    loadPredefinedTasks();
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentTask?.status === 'active') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentTask?.status]);

  const loadPredefinedTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (savedTasks) {
        setPredefinedTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      console.error('Error loading predefined tasks:', error);
    }
  };

  const savePredefinedTasks = async (newTasks: string[]) => {
    try {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
    } catch (error) {
      console.error('Error saving predefined tasks:', error);
    }
  };

  const addPredefinedTask = async () => {
    if (!newPredefinedTask.trim()) return;
    
    const updatedTasks = [...predefinedTasks, newPredefinedTask.trim()];
    setPredefinedTasks(updatedTasks);
    await savePredefinedTasks(updatedTasks);
    setNewPredefinedTask('');
  };

  const removePredefinedTask = async (taskToRemove: string) => {
    const updatedTasks = predefinedTasks.filter(task => task !== taskToRemove);
    setPredefinedTasks(updatedTasks);
    await savePredefinedTasks(updatedTasks);
  };

  const selectPredefinedTask = (selectedTask: string) => {
    setTaskName(selectedTask);
    setShowTasksModal(false);
  };

  const loadOperators = async () => {
    try {
      const savedOperators = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedOperators) {
        setOperators(JSON.parse(savedOperators));
      }
    } catch (error) {
      console.error('Error loading operators:', error);
    }
  };

  const saveOperators = async (newOperators: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newOperators));
    } catch (error) {
      console.error('Error saving operators:', error);
    }
  };

  const addOperator = async () => {
    if (!newOperator.trim()) return;
    
    const updatedOperators = [...operators, newOperator.trim()];
    setOperators(updatedOperators);
    await saveOperators(updatedOperators);
    setNewOperator('');
  };

  const removeOperator = async (operatorToRemove: string) => {
    const updatedOperators = operators.filter(op => op !== operatorToRemove);
    setOperators(updatedOperators);
    await saveOperators(updatedOperators);
  };

  const selectOperator = (operator: string) => {
    setOperatorName(operator);
    setShowOperatorsModal(false);
  };

  const startTask = () => {
    if (!taskName || !operatorName || !operatorsCount) return;

    const newTask: Task = {
      id: Date.now().toString(),
      name: taskName,
      operator: operatorName,
      operatorsCount: parseInt(operatorsCount, 10),
      startTime: new Date(),
      duration: 0,
      status: 'active',
      productionEntries: [],
      totalQuantity: 0,
      unit: ''
    };

    setCurrentTask(newTask);
    setTasks(prev => [newTask, ...prev]);
    setElapsedTime(0);
  };

  const handleQuantitySubmit = () => {
    if (!currentTask || !quantity || !unit) return;

    let updatedEntries = [...currentTask.productionEntries];
    let newTotalQuantity = currentTask.totalQuantity;

    if (isEditingLastEntry && updatedEntries.length > 0) {
      const lastEntry = updatedEntries[updatedEntries.length - 1];
      newTotalQuantity = currentTask.totalQuantity - lastEntry.quantity + parseFloat(quantity);
      updatedEntries[updatedEntries.length - 1] = {
        ...lastEntry,
        quantity: parseFloat(quantity),
        unit
      };
    } else {
      const newEntry: ProductionEntry = {
        timestamp: new Date(),
        quantity: parseFloat(quantity),
        unit
      };
      updatedEntries.push(newEntry);
      newTotalQuantity = currentTask.totalQuantity + parseFloat(quantity);
    }

    const updatedTask = {
      ...currentTask,
      status: isCompletingTask ? 'completed' : 'paused',
      endTime: isCompletingTask ? new Date() : undefined,
      duration: elapsedTime,
      productionEntries: updatedEntries,
      totalQuantity: newTotalQuantity,
      unit: unit
    };

    if (isCompletingTask) {
      setCurrentTask(null);
      setTaskName('');
      setOperatorName('');
      setOperatorsCount('1');
      setElapsedTime(0);
    } else {
      setCurrentTask(updatedTask);
    }

    setTasks(prev => prev.map(task => 
      task.id === currentTask.id ? updatedTask : task
    ));

    setShowQuantityModal(false);
    setQuantity('');
    setIsEditingLastEntry(false);
    setIsCompletingTask(false);
  };

  const editLastEntry = () => {
    if (!currentTask || currentTask.productionEntries.length === 0) return;

    const lastEntry = currentTask.productionEntries[currentTask.productionEntries.length - 1];
    setQuantity(lastEntry.quantity.toString());
    setUnit(lastEntry.unit);
    setIsEditingLastEntry(true);
    setShowQuantityModal(true);
  };

  const pauseTask = () => {
    if (!currentTask) return;

    if (currentTask.status === 'active') {
      setIsEditingLastEntry(false);
      setQuantity('');
      setUnit(currentTask.unit || '');
      setShowQuantityModal(true);
    } else {
      const updatedTask = {
        ...currentTask,
        status: 'active'
      };
      setCurrentTask(updatedTask);
      setTasks(prev => prev.map(task => 
        task.id === currentTask.id ? updatedTask : task
      ));
    }
  };

  const stopTask = () => {
    if (!currentTask) return;
    setIsCompletingTask(true);
    setIsEditingLastEntry(false);
    setQuantity('');
    setUnit(currentTask.unit || '');
    setShowQuantityModal(true);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'paused':
        return '#FFA000';
      case 'completed':
        return '#757575';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'paused':
        return 'En pause';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const exportTasks = async () => {
    try {
      setExportLoading(true);
      
      const headers = ['Date', 'Nom de la tâche', 'Opérateur', 'Nombre d\'opérateurs', 'Unité', 'Quantité totale', 'Heure de début', 'Heure de fin', 'Durée', 'Statut', 'Détails production'].join(',');
      
      const rows = tasks.map(task => {
        const taskDate = format(task.startTime, 'dd/MM/yyyy');
        const startTime = format(task.startTime, 'HH:mm:ss');
        const endTime = task.endTime ? format(task.endTime, 'HH:mm:ss') : '';
        const duration = formatTime(task.duration);
        const productionDetails = task.productionEntries
          .map(entry => `${format(entry.timestamp, 'HH:mm:ss')}: ${entry.quantity} ${entry.unit}`)
          .join('; ');
        
        return [
          taskDate,
          task.name.replace(/,/g, ';'),
          task.operator.replace(/,/g, ';'),
          task.operatorsCount,
          task.unit,
          task.totalQuantity,
          startTime,
          endTime,
          duration,
          getStatusText(task.status),
          productionDetails.replace(/,/g, ';')
        ].join(',');
      });

      const csvContent = [headers, ...rows].join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `taches_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const fileUri = `${FileSystem.documentDirectory}taches_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exporter les tâches',
          UTI: 'public.comma-separated-values-text'
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export des tâches:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const FilterButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: isActive ? '#007AFF' : isDark ? '#404040' : '#f0f0f0' }
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterButtonText,
        { color: isActive ? '#ffffff' : isDark ? '#ffffff' : '#000000' }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.operator.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredOperators = operators.filter(operator =>
    operator.toLowerCase().includes(operatorSearchQuery.toLowerCase())
  );

  const filteredPredefinedTasks = predefinedTasks.filter(task =>
    task.toLowerCase().includes(taskSearchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      <ScrollView style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={[styles.header, { color: isDark ? '#ffffff' : '#000000' }]}>
            Suivi des tâches
          </Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateContainer}>
              <Calendar size={20} color={isDark ? '#ffffff' : '#000000'} />
              <Text style={[styles.dateText, { color: isDark ? '#ffffff' : '#000000' }]}>
                {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <Clock size={20} color={isDark ? '#ffffff' : '#000000'} />
              <Text style={[styles.timeText, { color: isDark ? '#ffffff' : '#000000' }]}>
                {format(currentTime, 'HH:mm:ss')}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? '#2d2d2d' : '#ffffff' }]}>
          <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Nouvelle tâche
          </Text>
          
          <TouchableOpacity
            style={[styles.taskSelector, { 
              backgroundColor: isDark ? '#404040' : '#f0f0f0',
            }]}
            onPress={() => setShowTasksModal(true)}
          >
            <View style={styles.taskSelectorContent}>
              <ListPlus size={20} color={isDark ? '#ffffff' : '#000000'} />
              <Text style={[styles.taskSelectorText, { 
                color: taskName ? (isDark ? '#ffffff' : '#000000') : (isDark ? '#999999' : '#666666')
              }]}>
                {taskName || "Sélectionner une tâche"}
              </Text>
            </View>
            <ChevronDown size={20} color={isDark ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.operatorSelector, { 
              backgroundColor: isDark ? '#404040' : '#f0f0f0',
            }]}
            onPress={() => setShowOperatorsModal(true)}
          >
            <View style={styles.operatorSelectorContent}>
              <Users size={20} color={isDark ? '#ffffff' : '#000000'} />
              <Text style={[styles.operatorSelectorText, { 
                color: operatorName ? (isDark ? '#ffffff' : '#000000') : (isDark ? '#999999' : '#666666')
              }]}>
                {operatorName || "Sélectionner un opérateur"}
              </Text>
            </View>
            <ChevronDown size={20} color={isDark ? '#ffffff' : '#000000'} />
          </TouchableOpacity>

          <View style={styles.operatorsContainer}>
            <Users size={20} color={isDark ? '#ffffff' : '#000000'} />
            <TextInput
              style={[styles.operatorsInput, { 
                backgroundColor: isDark ? '#404040' : '#f0f0f0',
                color: isDark ? '#ffffff' : '#000000'
              }]}
              placeholder="Nombre d'opérateurs"
              placeholderTextColor={isDark ? '#999999' : '#666666'}
              value={operatorsCount}
              onChangeText={(text) => {
                const number = parseInt(text, 10);
                if (!isNaN(number) && number > 0) {
                  setOperatorsCount(text);
                } else if (text === '') {
                  setOperatorsCount('');
                }
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.timerContainer}>
            <Text style={[styles.timer, { color: isDark ? '#ffffff' : '#000000' }]}>
              {formatTime(elapsedTime)}
            </Text>
            
            <View style={styles.controls}>
              {!currentTask && (
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: '#4CAF50' }]} 
                  onPress={startTask}
                >
                  <Play color="white" size={24} />
                </TouchableOpacity>
              )}
              
              {currentTask && currentTask.status !== 'completed' && (
                <>
                  <TouchableOpacity 
                    style={[styles.button, { 
                      backgroundColor: currentTask.status === 'active' ? '#FFA000' : '#4CAF50'
                    }]} 
                    onPress={pauseTask}
                  >
                    {currentTask.status === 'active' ? (
                      <Pause color="white" size={24} />
                    ) : (
                      <Play color="white" size={24} />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, { backgroundColor: '#F44336' }]} 
                    onPress={stopTask}
                  >
                    <StopCircle color="white" size={24} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? '#2d2d2d' : '#ffffff' }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Historique des tâches
            </Text>
            <TouchableOpacity
              style={[styles.exportButton, exportLoading && styles.exportButtonDisabled]}
              onPress={exportTasks}
              disabled={exportLoading || tasks.length === 0}
            >
              <Download size={20} color={exportLoading || tasks.length === 0 ? '#666666' : '#007AFF'} />
              <Text style={[
                styles.exportButtonText,
                { color: exportLoading || tasks.length === 0 ? '#666666' : '#007AFF' }
              ]}>
                {exportLoading ? 'Export...' : 'Exporter CSV'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search 
              size={20} 
              color={isDark ? '#ffffff' : '#000000'} 
              style={styles.searchIcon} 
            />
            <TextInput
              style={[styles.searchInput, {
                backgroundColor: isDark ? '#404040' : '#f0f0f0',
                color: isDark ? '#ffffff' : '#000000'
              }]}
              placeholder="Rechercher des tâches ou des opérateurs..."
              placeholderTextColor={isDark ? '#999999' : '#666666'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterContainer}>
            <FilterButton
              title="Tout"
              isActive={statusFilter === 'all'}
              onPress={() => setStatusFilter('all')}
            />
            <FilterButton
              title="Actives"
              isActive={statusFilter === 'active'}
              onPress={() => setStatusFilter('active')}
            />
            <FilterButton
              title="En pause"
              isActive={statusFilter === 'paused'}
              onPress={() => setStatusFilter('paused')}
            />
            <FilterButton
              title="Terminées"
              isActive={statusFilter === 'completed'}
              onPress={() => setStatusFilter('completed')}
            />
          </View>

          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: isDark ? '#cccccc' : '#666666' }]}>
                Aucune tâche trouvée
              </Text>
            </View>
          ) : (
            filteredTasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <Text style={[styles.taskName, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {task.name}
                </Text>
                <Text style={[styles.taskDate, { color: isDark ? '#cccccc' : '#666666' }]}>
                  {format(task.startTime, 'EEEE d MMMM yyyy', { locale: fr })}
                </Text>
                <Text style={[styles.taskDetails, { color: isDark ? '#cccccc' : '#666666' }]}>
                  Opérateur : {task.operator}
                </Text>
                <Text style={[styles.taskDetails, { color: isDark ? '#cccccc' : '#666666' }]}>
                  Nombre d'opérateurs : {task.operatorsCount}
                </Text>
                {task.totalQuantity > 0 && (
                  <Text style={[styles.taskDetails, { color: isDark ? '#cccccc' : '#666666' }]}>
                    Production totale : {task.totalQuantity} {task.unit}
                  </Text>
                )}
                <Text style={[styles.taskDetails, { color: isDark ? '#cccccc' : '#666666' }]}>
                  Début : {format(task.startTime, 'HH:mm:ss')}
                </Text>
                {task.endTime && (
                  <Text style={[styles.taskDetails, { color: isDark ? '#cccccc' : '#666666' }]}>
                    Fin : {format(task.endTime, 'HH:mm:ss')}
                  </Text>
                )}
                <Text style={[styles.taskDetails, { color: isDark ? '#cccccc' : '#666666' }]}>
                  Durée : {formatTime(task.duration)}
                </Text>
                {task.productionEntries.length > 0 && (
                  <View style={styles.productionEntries}>
                    <Text style={[styles.productionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                      Détails de production :
                    </Text>
                    {task.productionEntries.map((entry, index) => (
                      <Text key={index} style={[styles.productionEntry, { color: isDark ? '#cccccc' : '#666666' }]}>
                        {format(entry.timestamp, 'HH:mm:ss')} : {entry.quantity} {entry.unit}
                      </Text>
                    ))}
                  </View>
                )}
                <View style={[styles.statusBadge, { 
                  backgroundColor: getStatusColor(task.status)
                }]}>
                  <Text style={styles.statusText}>
                    {getStatusText(task.status)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showOperatorsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOperatorsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#2d2d2d' : '#ffffff' }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Sélectionner un opérateur
              </Text>
              <TouchableOpacity 
                onPress={() => setShowOperatorsModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchContainer}>
                <Search 
                  size={20} 
                  color={isDark ? '#ffffff' : '#000000'} 
                  style={styles.searchIcon} 
                />
                <TextInput
                  style={[styles.searchInput, {
                    backgroundColor: isDark ? '#404040' : '#f0f0f0',
                    color: isDark ? '#ffffff' : '#000000'
                  }]}
                  placeholder="Rechercher un opérateur..."
                  placeholderTextColor={isDark ? '#999999' : '#666666'}
                  value={operatorSearchQuery}
                  onChangeText={setOperatorSearchQuery}
                />
              </View>

              <View style={styles.addOperatorContainer}>
                <TextInput
                  style={[styles.addOperatorInput, {
                    backgroundColor: isDark ? '#404040' : '#f0f0f0',
                    color: isDark ? '#ffffff' : '#000000'
                  }]}
                  placeholder="Ajouter un nouvel opérateur"
                  placeholderTextColor={isDark ? '#999999' : '#666666'}
                  value={newOperator}
                  onChangeText={setNewOperator}
                />
                <TouchableOpacity
                  style={[styles.addButton, !newOperator.trim() && styles.addButtonDisabled]}
                  onPress={addOperator}
                  disabled={!newOperator.trim()}
                >
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={filteredOperators}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.operatorItem, {
                      backgroundColor: operatorName === item ? 
                        (isDark ? '#404040' : '#e0e0e0') : 'transparent'
                    }]}
                    onPress={() => selectOperator(item)}
                  >
                    <Text style={[styles.operatorItemText, { 
                      color: isDark ? '#ffffff' : '#000000'
                    }]}>
                      {item}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeOperator(item)}
                    >
                      <X size={16} color={isDark ? '#ffffff' : '#000000'} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
                style={styles.operatorsList}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTasksModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTasksModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#2d2d2d' : '#ffffff' }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Sélectionner une tâche
              </Text>
              <TouchableOpacity 
                onPress={() => setShowTasksModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchContainer}>
                <Search 
                  size={20} 
                  color={isDark ? '#ffffff' : '#000000'} 
                  style={styles.searchIcon} 
                />
                <TextInput
                  style={[styles.searchInput, {
                    backgroundColor: isDark ? '#404040' : '#f0f0f0',
                    color: isDark ? '#ffffff' : '#000000'
                  }]}
                  placeholder="Rechercher une tâche..."
                  placeholderTextColor={isDark ? '#999999' : '#666666'}
                  value={taskSearchQuery}
                  onChangeText={setTaskSearchQuery}
                />
              </View>

              <View style={styles.addOperatorContainer}>
                <TextInput
                  style={[styles.addOperatorInput, {
                    backgroundColor: isDark ? '#404040' : '#f0f0f0',
                    color: isDark ? '#ffffff' : '#000000'
                  }]}
                  placeholder="Ajouter une nouvelle tâche"
                  placeholderTextColor={isDark ? '#999999' : '#666666'}
                  value={newPredefinedTask}
                  onChangeText={setNewPredefinedTask}
                />
                <TouchableOpacity
                  style={[styles.addButton, !newPredefinedTask.trim() && styles.addButtonDisabled]}
                  onPress={addPredefinedTask}
                  disabled={!newPredefinedTask.trim()}
                >
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={filteredPredefinedTasks}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.operatorItem, {
                      backgroundColor: taskName === item ? 
                        (isDark ? '#404040' : '#e0e0e0') : 'transparent'
                    }]}
                    onPress={() => selectPredefinedTask(item)}
                  >
                    <Text style={[styles.operatorItemText, { 
                      color: isDark ? '#ffffff' : '#000000'
                    }]}>
                      {item}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removePredefinedTask(item)}
                    >
                      <X size={16} color={isDark ? '#ffffff' : '#000000'} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
                style={styles.operatorsList}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showQuantityModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowQuantityModal(false);
          setIsEditingLastEntry(false);
          setIsCompletingTask(false);
        }}
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
                {isCompletingTask ? 'Production finale' : isEditingLastEntry ? 'Modifier la dernière production' : 'Saisie de la production'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowQuantityModal(false);
                  setIsEditingLastEntry(false);
                  setIsCompletingTask(false);
                }}
                style={styles.closeButton}
              >
                <X size={24} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {currentTask?.productionEntries.length > 0 && !isEditingLastEntry && !isCompletingTask && (
                <TouchableOpacity 
                  style={styles.lastEntryButton}
                  onPress={editLastEntry}
                >
                  <AlertCircle size={20} color={isDark ? '#ffffff' : '#000000'} />
                  <Text style={[styles.lastEntryText, { color: isDark ? '#ffffff' : '#000000' }]}>
                    Modifier la dernière saisie
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.quantityContainer}>
                <Scale size={20} color={isDark ? '#ffffff' : '#000000'} />
                <TextInput
                  style={[styles.quantityInput, {
                    backgroundColor: isDark ? '#404040' : '#f0f0f0',
                    color: isDark ? '#ffffff' : '#000000'
                  }]}
                  placeholder="Quantité produite"
                  placeholderTextColor={isDark ? '#999999' : '#666666'}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.unitContainer}>
                <Package size={20} color={isDark ? '#ffffff' : '#000000'} />
                <TextInput
                  style={[styles.unitInput, {
                    backgroundColor: isDark ? '#404040' : '#f0f0f0',
                    color: isDark ? '#ffffff' : '#000000'
                  }]}
                  placeholder="Unité (pcs, kg, m, etc.)"
                  placeholderTextColor={isDark ? '#999999' : '#666666'}
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, (!quantity || !unit) && styles.modalButtonDisabled]}
                onPress={handleQuantitySubmit}
                disabled={!quantity || !unit}
              >
                <Text style={styles.modalButtonText}>
                  {isCompletingTask ? 'Terminer la tâche' : isEditingLastEntry ? 'Modifier' : 'Valider'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
  },
  card: {
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
  },
  taskSelector: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskSelectorText: {
    fontSize: 16,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  operatorSelector: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  operatorSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  operatorSelectorText: {
    fontSize: 16,
  },
  operatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  operatorsInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
  },
  taskItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  productionEntries: {
    marginTop: 8,
  },
  productionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productionEntry: {
    fontSize: 14,
    marginBottom: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
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
  lastEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 166, 0, 0.1)',
  },
  lastEntryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  quantityInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  unitInput: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  addOperatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addOperatorInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  operatorsList: {
    maxHeight: 300,
  },
  operatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  operatorItemText: {
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
});
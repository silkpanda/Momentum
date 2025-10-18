import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router'; // <-- Import useRouter
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { API_URLS } from '../../constants/api';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface Task {
  _id: string;
  name: string;
  points: number;
  dueDate?: string;
}

const TasksScreen = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const { token, logout } = useAuth(); 
  const router = useRouter(); // <-- Add router hook

  // ... (all existing state declarations) ...
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskPoints, setTaskPoints] = useState('');
  const [selectedDueDate, setSelectedDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editedTaskName, setEditedTaskName] = useState('');
  const [editedTaskPoints, setEditedTaskPoints] = useState('');
  const [editedDueDate, setEditedDueDate] = useState<Date | null>(null);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  // ... (getAuthHeaders, handleApiError, DatePicker logic, fetchTasks, addTask) ...

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-auth-token': token || '',
  });

  const handleApiError = (err: any) => {
    if (err.status === 401) {
      Alert.alert('Session Expired', 'Please log in again.');
      logout();
    }
    else Alert.alert('Error', err.message || 'An unknown error occurred.');
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDueDate(selectedDate);
    }
  };
  
  const onEditDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEditDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEditedDueDate(selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    return date ? date.toLocaleDateString() : null;
  };

  const fetchTasks = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URLS.TASKS, { headers: getAuthHeaders() });
      if (!response.ok) throw { status: response.status, message: 'Failed to fetch tasks' };
      const data = await response.json();
      setTasks(data);
    } catch (e: any) {
      console.error('Failed to fetch tasks:', e);
      setError('Failed to load tasks. Please try again.');
      if(e.status === 401) logout(); 
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (taskName.trim() === '' || !token) return;
    try {
      const body = {
        name: taskName,
        points: Number(taskPoints) || 10,
        dueDate: selectedDueDate ? selectedDueDate.toISOString() : null,
      };
      
      const response = await fetch(API_URLS.TASKS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      
      if (!response.ok) throw { status: response.status, message: 'Failed to add task' };
      
      setTaskName('');
      setTaskPoints('');
      setSelectedDueDate(null);
      
      fetchTasks();
    } catch (e) { handleApiError(e); }
  };

  const completeTask = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URLS.TASKS}/${id}/complete`, { 
        method: 'POST', 
        headers: getAuthHeaders() 
      });
      if (!response.ok) throw { status: response.status, message: 'Failed to complete task' };
      fetchTasks();
    } catch (e) { handleApiError(e); }
  };

  const deleteTask = async (id: string) => {
    if (!token) return;
    Alert.alert("Delete Task", "Are you sure you want to permanently delete this task?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            try {
              const response = await fetch(`${API_URLS.TASKS}/${id}`, { 
                method: 'DELETE', 
                headers: getAuthHeaders() 
              });
              if (!response.ok) throw { status: response.status, message: 'Failed to delete task' };
              fetchTasks();
            } catch (e) { handleApiError(e); }
          }
        }
      ]
    );
  };

  const handleEdit = async () => {
    if (!editingTask || editedTaskName.trim() === '' || !token) return;
    try {
      const body = {
        name: editedTaskName,
        points: Number(editedTaskPoints) || 10,
        dueDate: editedDueDate ? editedDueDate.toISOString() : null,
      };
      
      const response = await fetch(`${API_URLS.TASKS}/${editingTask._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!response.ok) throw { status: response.status, message: 'Failed to update task' };
      closeEditModal();
      fetchTasks();
    } catch (e) { handleApiError(e); }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditedTaskName(task.name);
    setEditedTaskPoints(String(task.points));
    setEditedDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingTask(null);
    setEditedTaskName('');
    setEditedTaskPoints('');
    setEditedDueDate(null);
  };

  const sendToFocus = (id: string) => {
    router.push(`/focus-mode?taskId=${id}`);
  };

  useFocusEffect(useCallback(() => {
    if(token) { 
      fetchTasks();
    }
  }, [token])); 

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors[colorScheme].background },
    container: { flex: 1, paddingHorizontal: 20 },
    inputContainer: { flexDirection: 'row', marginTop: 20, marginBottom: 20, gap: 10, flexWrap: 'wrap' },
    inputName: { flex: 1, minWidth: '40%', borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, fontSize: 16 },
    inputPoints: { width: 70, borderColor: Colors[colorScheme].border, color: Colors[colorScheme].text, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, fontSize: 16, textAlign: 'center' },
    button: { backgroundColor: Colors.light.tint, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 8, height: 44 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    dateButton: { borderColor: Colors[colorScheme].border, borderWidth: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderRadius: 8, height: 44 },
    dateButtonText: { color: Colors[colorScheme].textSecondary },
    dateButtonTextSelected: { color: Colors.light.tint, fontWeight: 'bold' },
    taskContainer: { paddingVertical: 15, paddingLeft: 15, backgroundColor: Colors[colorScheme].backgroundMuted, borderWidth: 1, borderColor: Colors[colorScheme].border, borderRadius: 8, marginBottom: 10 },
    taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    taskInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    taskNameContainer: { flexShrink: 1, marginRight: 10 },
    taskName: { fontSize: 16, color: Colors[colorScheme].text },
    taskDueDate: { fontSize: 12, color: Colors[colorScheme].textSecondary },
    taskActions: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10 }, // Reduced gap
    actionButton: { padding: 5 },
    pointsBadge: { backgroundColor: Colors[colorScheme].tint, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    pointsText: { color: Colors[colorScheme].background, fontWeight: 'bold' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ff453a' },
    modalView: { margin: 20, backgroundColor: Colors[colorScheme].background, borderRadius: 20, padding: 35, alignItems: 'center', borderWidth: 1, borderColor: Colors[colorScheme].border},
    modalText: { marginBottom: 15, textAlign: 'center', fontSize: 18, color: Colors[colorScheme].text },
    modalInputContainer: { gap: 10, width: '100%', marginBottom: 20 },
    modalInputRow: { flexDirection: 'row', gap: 10 },
    modalButtonContainer: { flexDirection: 'row', gap: 10, marginTop: 10 },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        {/* ... (Input Container and DatePicker) ... */}
        <View style={styles.inputContainer}>
          <TextInput style={styles.inputName} placeholder="New task name..." placeholderTextColor={Colors[colorScheme].textSecondary} value={taskName} onChangeText={setTaskName}/>
          <TextInput style={styles.inputPoints} placeholder="Pts" placeholderTextColor={Colors[colorScheme].textSecondary} value={taskPoints} onChangeText={setTaskPoints} keyboardType="number-pad" />
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={selectedDueDate ? styles.dateButtonTextSelected : styles.dateButtonText}>
              {selectedDueDate ? formatDate(selectedDueDate) : 'Due Date'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={addTask}><Text style={styles.buttonText}>Add</Text></TouchableOpacity>
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={selectedDueDate || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        
        {loading ? ( <View style={styles.centered}><ActivityIndicator size="large" color={Colors.light.tint} /><ThemedText>Loading tasks...</ThemedText></View>
        ) : error ? ( <View style={styles.centered}><ThemedText style={styles.errorText}>{error}</ThemedText></View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.taskContainer}>
                <View style={styles.taskRow}>
                  <View style={styles.taskInfo}>
                    <View style={styles.pointsBadge}><Text style={styles.pointsText}>{item.points}</Text></View>
                    <View style={styles.taskNameContainer}>
                      <ThemedText style={styles.taskName}>{item.name}</ThemedText>
                      {item.dueDate && (
                        <ThemedText style={styles.taskDueDate}>
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  {/* --- MODIFIED TASK ACTIONS --- */}
                  <View style={styles.taskActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => sendToFocus(item._id)}>
                      <Ionicons name="eye-outline" size={24} color={Colors.light.tint} />
                    </TouchableOpacity>
                    {/* --- CORRECTION: Typo fixed --- */}
                    <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}><Ionicons name="pencil" size={24} color={Colors[colorScheme].textSecondary} /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => deleteTask(item._id)}><Ionicons name="trash-outline" size={24} color={'#ff453a'} /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => completeTask(item._id)}><Ionicons name="checkmark-circle-outline" size={28} color={'#34c759'} /></TouchableOpacity>
                  </View>
                  {/* --- END MODIFICATION --- */}
                </View>
              </View>
            )}
            ListEmptyComponent={<View style={styles.centered}><ThemedText>No tasks yet. Add one!</ThemedText></View>}
          />
        )}
      </ThemedView>

      {/* ... (Edit Modal) ... */}
      <Modal animationType="slide" transparent={true} visible={isEditModalVisible} onRequestClose={closeEditModal}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <View style={styles.modalView}>
                <ThemedText style={styles.modalText}>Edit Task</ThemedText>
                <View style={styles.modalInputContainer}>
                    <View style={styles.modalInputRow}>
                      <TextInput style={styles.inputName} value={editedTaskName} onChangeText={setEditedTaskName} />
                      <TextInput style={styles.inputPoints} value={editedTaskPoints} onChangeText={setEditedTaskPoints} keyboardType="number-pad"/>
                    </View>
                    <TouchableOpacity style={[styles.dateButton, {width: '100%'}]} onPress={() => setShowEditDatePicker(true)}>
                      <Text style={editedDueDate ? styles.dateButtonTextSelected : styles.dateButtonText}>
                        {editedDueDate ? formatDate(editedDueDate) : 'Set Due Date'}
                      </Text>
                    </TouchableOpacity>
                    {showEditDatePicker && (
                      <DateTimePicker
                        value={editedDueDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={onEditDateChange}
                      />
                    )}
                </View>
                <View style={styles.modalButtonContainer}>
                    <TouchableOpacity style={[styles.button, {backgroundColor: Colors[colorScheme].textSecondary}]} onPress={closeEditModal}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleEdit}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TasksScreen;
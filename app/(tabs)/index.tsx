import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { API_URLS } from '../../constants/api';

interface Task {
  _id: string;
  name: string;
  points: number;
}

const TasksScreen = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [taskName, setTaskName] = useState('');
  const [taskPoints, setTaskPoints] = useState('');

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editedTaskName, setEditedTaskName] = useState('');
  const [editedTaskPoints, setEditedTaskPoints] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URLS.TASKS);
      if (!response.ok) throw new Error(`Server returned status ${response.status}`);
      const data = await response.json();
      setTasks(data);
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (taskName.trim() === '') return;
    try {
      const response = await fetch(API_URLS.TASKS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: taskName, points: Number(taskPoints) || 10 }),
      });
      if (!response.ok) throw new Error('Failed to add task');
      setTaskName('');
      setTaskPoints('');
      fetchTasks();
    } catch (e) {
      console.error('Failed to add task:', e);
      Alert.alert('Error', 'Could not add the task.');
    }
  };

  const completeTask = async (id: string) => {
    try {
      const response = await fetch(API_URLS.TASK_COMPLETE(id), { method: 'POST' });
      if (!response.ok) throw new Error('Failed to complete task');
      fetchTasks();
    } catch (e) {
      console.error('Failed to complete task:', e);
      Alert.alert('Error', 'Could not complete the task.');
    }
  };

  const deleteTask = async (id: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to permanently delete this task? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            try {
              const response = await fetch(`${API_URLS.TASKS}/${id}`, { method: 'DELETE' });
              if (!response.ok) throw new Error('Failed to delete task');
              fetchTasks();
            } catch (e) {
              console.error('Failed to delete task:', e);
              Alert.alert('Error', 'Could not delete the task.');
            }
          }
        }
      ]
    );
  };

  const handleEdit = async () => {
    if (!editingTask || editedTaskName.trim() === '') return;
    try {
      const response = await fetch(`${API_URLS.TASKS}/${editingTask._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedTaskName, points: Number(editedTaskPoints) || 10 }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      closeEditModal();
      fetchTasks();
    } catch (e) {
      console.error('Failed to edit task:', e);
      Alert.alert('Error', 'Could not update the task.');
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditedTaskName(task.name);
    setEditedTaskPoints(String(task.points));
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingTask(null);
    setEditedTaskName('');
    setEditedTaskPoints('');
  };

  useFocusEffect(useCallback(() => { fetchTasks(); }, []));

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors[colorScheme].background },
    container: { flex: 1, paddingHorizontal: 20 },
    inputContainer: { flexDirection: 'row', marginTop: 20, marginBottom: 20, gap: 10 },
    inputName: { flex: 1, borderColor: Colors[colorScheme].icon, color: Colors[colorScheme].text, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, fontSize: 16 },
    inputPoints: { width: 70, borderColor: Colors[colorScheme].icon, color: Colors[colorScheme].text, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, fontSize: 16, textAlign: 'center' },
    button: { backgroundColor: Colors[colorScheme].tint, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 8 },
    buttonText: { color: Colors[colorScheme].background, fontSize: 16, fontWeight: 'bold' },
    taskContainer: { paddingVertical: 15, paddingLeft: 15, backgroundColor: Colors[colorScheme].background, borderWidth: 1, borderColor: Colors[colorScheme].icon, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    taskInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    taskActions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10 },
    actionButton: { padding: 5 },
    pointsBadge: { backgroundColor: Colors[colorScheme].tint, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    pointsText: { color: Colors[colorScheme].background, fontWeight: 'bold' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ff453a' },
    modalView: { margin: 20, backgroundColor: Colors[colorScheme].background, borderRadius: 20, padding: 35, alignItems: 'center', borderWidth: 1, borderColor: Colors[colorScheme].icon},
    modalText: { marginBottom: 15, textAlign: 'center', fontSize: 18 },
    modalInputContainer: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 20 },
    modalButtonContainer: { flexDirection: 'row', gap: 10 },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput style={styles.inputName} placeholder="New task name..." placeholderTextColor={Colors[colorScheme].icon} value={taskName} onChangeText={setTaskName}/>
          <TextInput style={styles.inputPoints} placeholder="Pts" placeholderTextColor={Colors[colorScheme].icon} value={taskPoints} onChangeText={setTaskPoints} keyboardType="number-pad" />
          <TouchableOpacity style={styles.button} onPress={addTask}><Text style={styles.buttonText}>Add</Text></TouchableOpacity>
        </View>
        
        {loading ? ( <View style={styles.centered}><ActivityIndicator size="large" color={Colors[colorScheme].tint} /><ThemedText>Loading tasks...</ThemedText></View>
        ) : error ? ( <View style={styles.centered}><ThemedText style={styles.errorText}>{error}</ThemedText></View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.taskContainer}>
                <View style={styles.taskInfo}>
                  <View style={styles.pointsBadge}><Text style={styles.pointsText}>{item.points}</Text></View>
                  <ThemedText>{item.name}</ThemedText>
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}><Ionicons name="pencil" size={24} color={Colors[colorScheme].icon} /></TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => deleteTask(item._id)}><Ionicons name="trash-outline" size={24} color={'#ff453a'} /></TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => completeTask(item._id)}><Ionicons name="checkmark-circle-outline" size={28} color={'#34c759'} /></TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<View style={styles.centered}><ThemedText>No tasks yet. Add one!</ThemedText></View>}
          />
        )}
      </ThemedView>

      <Modal animationType="slide" transparent={true} visible={isEditModalVisible} onRequestClose={closeEditModal}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <View style={styles.modalView}>
                <ThemedText style={styles.modalText}>Edit Task</ThemedText>
                <View style={styles.modalInputContainer}>
                    <TextInput style={styles.inputName} value={editedTaskName} onChangeText={setEditedTaskName} />
                    <TextInput style={styles.inputPoints} value={editedTaskPoints} onChangeText={setEditedTaskPoints} keyboardType="number-pad"/>
                </View>
                <View style={styles.modalButtonContainer}>
                    <TouchableOpacity style={[styles.button, {backgroundColor: Colors[colorScheme].icon}]} onPress={closeEditModal}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleEdit}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TasksScreen;
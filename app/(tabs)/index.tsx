import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, Button, FlatList, Text, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { API_URLS } from '../../constants/api';

interface Task {
  _id: string;
  name: string;
}

const TasksScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskName, setTaskName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URLS.TASKS);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.msg || `HTTP error! status: ${response.status}`);
      }

      const data: Task[] = await response.json();
      setTasks(data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error('Failed to fetch tasks:', errorMessage);
      setError('Failed to load tasks. Please try again.');
      Alert.alert('Error', 'Could not fetch tasks from the server.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const addTask = async () => {
    if (taskName.trim() === '') return;
    try {
      const response = await fetch(API_URLS.TASKS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: taskName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.msg || `HTTP error! status: ${response.status}`);
      }

      setTaskName('');
      fetchTasks();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error('Failed to add task:', errorMessage);
      Alert.alert('Error', 'Could not add the task.');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`${API_URLS.TASKS}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.msg || `HTTP error! status: ${response.status}`);
      }
      
      fetchTasks();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error('Failed to delete task:', errorMessage);
      Alert.alert('Error', 'Could not delete the task.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          value={taskName}
          onChangeText={setTaskName}
        />
        <Button title="Add" onPress={addTask} />
      </View>
      {loading ? (
        <Text>Loading tasks...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.taskContainer}>
              <Text style={styles.taskText}>{item.name}</Text>
              <TouchableOpacity onPress={() => deleteTask(item._id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 5,
    marginBottom: 10,
  },
  taskText: {
    fontSize: 16,
  },
  deleteText: {
    color: 'red',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TasksScreen;
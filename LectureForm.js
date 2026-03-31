import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, Button, Text, Alert } from 'react-native';
import { db } from './firebaseConfig';
import { collection, addDoc } from "firebase/firestore"; 

export default function LecturerForm() {
  const [formData, setFormData] = useState({
    facultyName: 'FICT', // [cite: 11, 23]
    className: '', // [cite: 25]
    week: '', // [cite: 26]
    date: new Date().toLocaleDateString(), // [cite: 27]
    courseName: '', // [cite: 28]
    courseCode: '', // [cite: 29]
    lecturerName: '', // [cite: 30]
    studentsPresent: '', // [cite: 31]
    totalStudents: '50', // [cite: 32]
    venue: '', // [cite: 34]
    time: '', // [cite: 35]
    topic: '', // [cite: 36]
    outcomes: '', // [cite: 37]
    recommendations: '' // [cite: 38]
  });

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, "reports"), formData);
      Alert.alert("Success", "Report submitted successfully!");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Lecturer Reporting Form</Text>
      {Object.keys(formData).map((key) => (
        <TextInput
          key={key}
          placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
          style={styles.input}
          onChangeText={(value) => setFormData({ ...formData, [key]: value })}
          value={formData[key]}
        />
      ))}
      <Button title="Submit Report" onPress={handleSubmit} color="#FF69B4" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#121212' },
  title: { fontSize: 20, color: '#FF69B4', marginBottom: 20, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', marginBottom: 10, padding: 10, borderRadius: 5 }
});
//To handle student monitoring and attendence

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function StudentDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Portal</Text>
      <TouchableOpacity style={styles.button}><Text style={styles.btnText}>View My Attendance</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button}><Text style={styles.btnText}>Rate Lecture</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button}><Text style={styles.btnText}>System Monitoring</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  title: { fontSize: 22, color: '#FF69B4', marginBottom: 20, fontWeight: 'bold' },
  button: { backgroundColor: '#FF69B4', padding: 15, borderRadius: 8, marginBottom: 10 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});
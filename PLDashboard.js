// purpose: High-level management,adding courses, and asigning modules

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function PLDashboard() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Program Leader Dashboard</Text>
      <TouchableOpacity style={styles.actionBtn}><Text style={styles.btnText}>+ Add New Course</Text></TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}><Text style={styles.btnText}>Assign Lecture Modules</Text></TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}><Text style={styles.btnText}>View PRL Reports</Text></TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}><Text style={styles.btnText}>Manage Classes</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  title: { fontSize: 22, color: '#FF69B4', marginBottom: 20, fontWeight: 'bold' },
  actionBtn: { borderWidth: 1, borderColor: '#FF69B4', padding: 15, borderRadius: 8, marginBottom: 10 },
  btnText: { color: '#FF69B4', textAlign: 'center' }
});
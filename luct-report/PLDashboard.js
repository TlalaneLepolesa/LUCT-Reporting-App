import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { db } from './firebaseConfig';
import { collection, onSnapshot, addDoc, query, where } from "firebase/firestore";

export default function PLDashboard() {
  const [reports, setReports] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [selectedLec, setSelectedLec] = useState(null); // Controls the pop-up for Lecturer Info
  const [courseForm, setCourseForm] = useState({ name: '', code: '', lec: '' });

  useEffect(() => {
    // 1. Fetch Reports
    const unsubReports = onSnapshot(collection(db, "reports"), snap => {
      setReports(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    // 2. Fetch Ratings
    const unsubRatings = onSnapshot(collection(db, "ratings"), snap => {
      setRatings(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    // 3. Fetch Active Lecturers
    const unsubLecturers = onSnapshot(query(collection(db, "users"), where("role", "==", "Lecturer")), snap => {
      setLecturers(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubReports(); unsubRatings(); unsubLecturers(); };
  }, []);

  // Function to assign a new module
  const assignModule = async () => {
    if (!courseForm.name || !courseForm.lec) {
      return Alert.alert("Error", "Please fill in the Course Name and Lecturer Email");
    }
    try {
      await addDoc(collection(db, "courses"), { 
        courseName: courseForm.name, 
        courseCode: courseForm.code, 
        lecturerEmail: courseForm.lec,
        faculty: "FICT" 
      });
      Alert.alert("Success", "Module assigned successfully.");
      setCourseForm({ name: '', code: '', lec: '' }); // Clear the form
    } catch (e) { 
      Alert.alert("Error", e.message); 
    }
  };

  return (
    <ScrollView style={styles.background} contentContainerStyle={{paddingBottom: 50}}>
      <View style={styles.container}>
        <Text style={styles.header}>Program Leader Dashboard</Text>

        {/* SECTION 1: Courses (Add & Assign) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Assign New Module</Text>
          <TextInput placeholder="Course Name" placeholderTextColor="#666" style={styles.input} value={courseForm.name} onChangeText={v => setCourseForm({...courseForm, name: v})} />
          <TextInput placeholder="Course Code" placeholderTextColor="#666" style={styles.input} value={courseForm.code} onChangeText={v => setCourseForm({...courseForm, code: v})} />
          <TextInput placeholder="Lecturer Email" placeholderTextColor="#666" style={styles.input} value={courseForm.lec} onChangeText={v => setCourseForm({...courseForm, lec: v})} />
          <TouchableOpacity style={styles.actionBtn} onPress={assignModule}>
            <Text style={styles.btnText}>Assign Module</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: Interactive Lecturers Directory */}
        <Text style={styles.sectionTitle}>Active Lecturers Directory</Text>
        <Text style={styles.hintText}>Tap a lecturer to view their profile</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
          {lecturers.length === 0 ? <Text style={{color: '#888'}}>No active lecturers found.</Text> : 
            lecturers.map(l => (
              <TouchableOpacity key={l.id} style={styles.lecBadge} onPress={() => setSelectedLec(l)}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>{l.email?.split('@')[0]}</Text>
                <Text style={{color: '#538cf7', fontSize: 10, marginTop: 4}}>View Profile</Text>
              </TouchableOpacity>
            ))
          }
        </ScrollView>

        {/* SECTION 3: Reports & PRL Oversight */}
        <Text style={styles.sectionTitle}>Lecture Reports & PRL Reviews</Text>
        {reports.length === 0 ? <Text style={{color: '#888'}}>No reports submitted yet.</Text> :
          reports.map(r => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardTitle}>{r.courseName || "Unnamed Course"}</Text>
              <Text style={styles.cardSub}>Lecturer: {r.lecturerEmail}</Text>
              <Text style={styles.cardSub}>Topic: {r.topicTaught}</Text>
              <View style={styles.feedbackBox}>
                <Text style={styles.fbLabel}>PRL FEEDBACK:</Text>
                <Text style={styles.fbText}>{r.prlFeedback || "Pending PRL Review..."}</Text>
              </View>
            </View>
          ))
        }

        {/* SECTION 4: Monitoring & Ratings */}
        <Text style={styles.sectionTitle}>Student Rating Monitoring</Text>
        {ratings.length === 0 ? <Text style={{color: '#888'}}>No ratings submitted yet.</Text> :
          ratings.map(rt => (
            <View key={rt.id} style={styles.miniCard}>
              <Text style={{color: '#538cf7', fontWeight: 'bold'}}>{rt.lecturerEmail?.split('@')[0]}</Text>
              <Text style={{color: '#ddd'}}>Engagement Score: {rt.scores?.engagement || 0} / 5</Text>
              <Text style={{color: '#ddd'}}>Clarity Score: {rt.scores?.clarity || 0} / 5</Text>
            </View>
          ))
        }

        {/* POP-UP MODAL: Lecturer Profile Details */}
        <Modal visible={!!selectedLec} transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Lecturer Details</Text>
              <Text style={styles.modalText}>Email: <Text style={{fontWeight: 'bold'}}>{selectedLec?.email}</Text></Text>
              <Text style={styles.modalText}>Role: Lecturer</Text>
              <Text style={styles.modalText}>Faculty: FICT</Text>
              <Text style={styles.modalText}>Status: Active</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedLec(null)}>
                <Text style={styles.btnText}>Close Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#121212' },
  container: { padding: 20, marginTop: 40 },
  header: { fontSize: 26, color: '#538cf7', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#3639d4', paddingLeft: 10 },
  hintText: { color: '#888', fontSize: 12, marginBottom: 10, fontStyle: 'italic' },
  card: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  input: { backgroundColor: '#121212', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  actionBtn: { backgroundColor: '#538cf7', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  lecBadge: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 12, marginRight: 12, minWidth: 120, alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  cardTitle: { color: '#538cf7', fontWeight: 'bold', fontSize: 18, marginBottom: 5 },
  cardSub: { color: '#aaa', fontSize: 13, marginBottom: 3 },
  feedbackBox: { marginTop: 12, padding: 10, backgroundColor: '#121212', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#538cf7' },
  fbLabel: { color: '#538cf7', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  fbText: { color: '#ddd', fontSize: 13, fontStyle: 'italic' },
  miniCard: { backgroundColor: '#1e1e1e', padding: 12, borderRadius: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1e1e1e', width: '85%', padding: 25, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#538cf7', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalText: { color: '#ddd', fontSize: 16, marginBottom: 12 },
  closeBtn: { backgroundColor: '#333', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#555' }
});
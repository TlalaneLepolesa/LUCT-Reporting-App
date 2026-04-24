import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, query, getDocs, where, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('menu');
  const [loading, setLoading] = useState(false);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [scores, setScores] = useState({ clarity: 5, punctuality: 5, engagement: 5 });

  useEffect(() => {
    const q = query(collection(db, "courses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courseList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(courseList);
    });
    return () => unsubscribe();
  }, []);

  const fetchMyAttendance = async () => {
    setLoading(true);
    try {
      const userEmail = auth.currentUser?.email;
      const querySnapshot = await getDocs(collection(db, "reports"));
      let total = 0, attended = 0;
      querySnapshot.forEach((doc) => {
        const details = doc.data().attendanceDetails;
        if (details && details[userEmail] !== undefined) {
          total++;
          if (details[userEmail] === true) attended++;
        }
      });
      setAttendanceRate(total > 0 ? ((attended / total) * 100).toFixed(1) : 0);
      setActiveTab('attendance');
    } catch (e) { Alert.alert("Error", e.message); }
    setLoading(false);
  };

  const startRating = async () => {
    setLoading(true);
    const q = query(collection(db, "users"), where("role", "==", "Lecturer"));
    const snap = await getDocs(q);
    setLecturers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setActiveTab('rate');
    setLoading(false);
  };

  const submitRating = async () => {
    if (!selectedLecturer) return Alert.alert("Error", "Select a lecturer first.");
    await addDoc(collection(db, "ratings"), {
      lecturerEmail: selectedLecturer.email,
      studentEmail: auth.currentUser?.email,
      scores,
      timestamp: serverTimestamp()
    });
    Alert.alert("Success", "Rating stored in real-time.");
    setActiveTab('menu');
  };

  if (activeTab === 'menu') return (
    <View style={styles.background}>
      <View style={styles.responsiveContainer}>
        <Text style={styles.title}>Student Portal</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={fetchMyAttendance}><Text style={styles.btnText}>My Attendance Status</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={startRating}><Text style={styles.btnText}>Rate My Last Lecture</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('progress')}><Text style={styles.btnText}>Academic Monitoring</Text></TouchableOpacity>
      </View>
    </View>
  );

  if (activeTab === 'rate') return (
    <ScrollView style={styles.background} contentContainerStyle={{padding: 20, marginTop: 40}}>
      <Text style={styles.title}>Rate Lecturer</Text>
      <ScrollView horizontal style={{marginBottom: 20}}>
        {lecturers.map(lec => (
          <TouchableOpacity key={lec.id} onPress={() => setSelectedLecturer(lec)} style={[styles.lecCard, selectedLecturer?.id === lec.id && styles.activeLec]}>
            <Text style={{color: '#fff'}}>{lec.email?.split('@')[0]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {['Clarity', 'Punctuality', 'Engagement'].map(key => (
        <View key={key} style={styles.rateRow}>
          <Text style={styles.rateLabel}>{key}</Text>
          <View style={styles.starRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setScores({...scores, [key.toLowerCase()]: n})}>
                <Text style={[styles.starIcon, scores[key.toLowerCase()] >= n ? styles.starActive : styles.starInactive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.submitBtn} onPress={submitRating}><Text style={styles.btnText}>Submit Rating</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveTab('menu')}><Text style={styles.cancelText}>Back</Text></TouchableOpacity>
    </ScrollView>
  );

  if (activeTab === 'progress') return (
    <View style={styles.background}>
      <ScrollView contentContainerStyle={styles.responsiveContainer}>
        <Text style={styles.title}>Real-Time Monitoring</Text>
        {courses.map((c, i) => (
          <View key={i} style={styles.monitorItem}>
            <Text style={styles.courseTitle}>{c.courseName}</Text>
            <Text style={styles.courseCode}>{c.courseCode}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('menu')}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (activeTab === 'attendance') return (
    <View style={styles.background}>
      <View style={styles.responsiveContainer}>
        <Text style={styles.title}>Attendance</Text>
        <View style={styles.card}>
          <Text style={styles.bigStat}>{attendanceRate}%</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${attendanceRate}%` }]} /></View>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('menu')}><Text style={styles.backText}>Back</Text></TouchableOpacity>
      </View>
    </View>
  );
  return null;
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#121212' },
  responsiveContainer: { width: '90%', maxWidth: 450, alignSelf: 'center', marginTop: 50 },
  title: { fontSize: 26, color: '#538cf7', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  actionBtn: { backgroundColor: '#1e1e1e', padding: 20, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#538cf7' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  lecCard: { backgroundColor: '#333', padding: 15, borderRadius: 10, marginRight: 10 },
  activeLec: { backgroundColor: '#442233', borderColor: '#538cf7', borderWidth: 1 },
  rateRow: { marginBottom: 15 },
  rateLabel: { color: '#fff', marginBottom: 5 },
  starRow: { flexDirection: 'row' },
  starIcon: { fontSize: 30, marginRight: 5 },
  starActive: { color: '#538cf7' },
  starInactive: { color: '#333' },
  submitBtn: { backgroundColor: '#538cf7', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  cancelText: { color: '#888', textAlign: 'center', marginTop: 20 },
  monitorItem: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 10, marginBottom: 10 },
  courseTitle: { color: '#fff', fontWeight: 'bold' },
  courseCode: { color: '#888' },
  card: { backgroundColor: '#1e1e1e', padding: 40, borderRadius: 20, alignItems: 'center' },
  bigStat: { fontSize: 60, color: '#538cf7', fontWeight: 'bold' },
  progressBar: { height: 8, backgroundColor: '#333', width: '100%', borderRadius: 4, marginTop: 20 },
  progressFill: { height: '100%', backgroundColor: '#538cf7' },
  backBtn: { marginTop: 20, alignSelf: 'center' },
  backText: { color: '#538cf7', fontWeight: 'bold' }
});
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Alert, Modal, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, onSnapshot, addDoc, query, where, serverTimestamp } from "firebase/firestore";
import { signOut } from 'firebase/auth';

export default function PLDashboard({ navigation }) {
  const [reports, setReports] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [selectedLec, setSelectedLec] = useState(null);
  const [courseForm, setCourseForm] = useState({ name: '', code: '', lec: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch Reports
    const unsubReports = onSnapshot(collection(db, "reports"), snap => {
      setReports(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, err => console.log("Reports Error:", err));
    
    // 2. Fetch Lecturers
    const unsubLecturers = onSnapshot(query(collection(db, "users"), where("role", "==", "Lecturer")), snap => {
      setLecturers(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, err => console.log("Lec Error:", err));

    // 3. Fetch All Courses
    const unsubCourses = onSnapshot(collection(db, "courses"), snap => {
      setCourses(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, err => console.log("Course Error:", err));

    // 4. Fetch All Ratings
    const unsubRatings = onSnapshot(collection(db, "ratings"), snap => {
      setRatings(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, err => console.log("Rating Error:", err));

    return () => { unsubReports(); unsubLecturers(); unsubCourses(); unsubRatings(); };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace('Auth'); // Make sure this matches your App.js name
    } catch (e) { Alert.alert("Error", "Logout failed."); }
  };

  const assignModule = async () => {
    if (!courseForm.name || !courseForm.lec) return Alert.alert("Error", "Fill all required fields.");
    setIsSubmitting(true);
    try {
      const cleanEmail = courseForm.lec.trim().toLowerCase();
      
      // Assign the Course
      await addDoc(collection(db, "courses"), { ...courseForm, lec: cleanEmail, faculty: "FICT" });
      
      // Create a Notification for the Lecturer
      await addDoc(collection(db, "notifications"), {
        lecturerEmail: cleanEmail,
        title: "New Module Assigned",
        message: `You have been assigned to teach ${courseForm.name} (${courseForm.code || 'N/A'}).`,
        read: false,
        timestamp: serverTimestamp()
      });

      Alert.alert("Success", "Module assigned and lecturer notified.");
      setCourseForm({ name: '', code: '', lec: '' });
    } catch (e) { Alert.alert("Error", e.message); }
    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Program Management</Text>
          <Text style={styles.subHeaderText}>FICT Department Oversight</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.groupLabel}>Administrative Actions</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assign New Module</Text>
          <TextInput placeholder="Course Name" placeholderTextColor="#94a3b8" style={styles.input} value={courseForm.name} onChangeText={v => setCourseForm({...courseForm, name: v})} />
          <View style={styles.row}>
            <TextInput placeholder="Code" placeholderTextColor="#94a3b8" style={[styles.input, { flex: 1, marginRight: 10 }]} value={courseForm.code} onChangeText={v => setCourseForm({...courseForm, code: v})} />
            <TextInput placeholder="Lecturer Email" placeholderTextColor="#94a3b8" style={[styles.input, { flex: 2 }]} value={courseForm.lec} autoCapitalize="none" onChangeText={v => setCourseForm({...courseForm, lec: v})} />
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={assignModule} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm Assignment</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.groupLabel}>Lecturer Monitoring</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lecList}>
          {lecturers.map(l => (
            <TouchableOpacity key={l.id} style={styles.lecBadge} onPress={() => setSelectedLec(l)}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{(l.fullName || l.email || "U")[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.lecName} numberOfLines={1}>{l.fullName || l.email?.split('@')[0] || "Unknown"}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.groupLabel}>Quality Assurance Feed</Text>
        {reports.length === 0 ? <Text style={styles.emptyText}>No reports available.</Text> : reports.map(r => (
          <View key={r.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{r.courseName}</Text>
              <View style={[styles.statusTag, { backgroundColor: r.reviewedByPRL ? '#059669' : '#ca8a04' }]}>
                <Text style={styles.statusText}>{r.reviewedByPRL ? 'Verified' : 'Pending'}</Text>
              </View>
            </View>
            <Text style={styles.reportSub}>Lecturer: {r.lecturerEmail}</Text>
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackLabel}>PRL NOTE:</Text>
              <Text style={styles.feedbackContent}>{r.prlFeedback || "Awaiting PRL review..."}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MONITORING MODAL */}
      <Modal visible={!!selectedLec} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Lecturer Dossier</Text>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionHeader}>Profile Information</Text>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Name:</Text><Text style={styles.infoVal}>{selectedLec?.fullName || "Not Provided"}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Email:</Text><Text style={styles.infoVal}>{selectedLec?.email}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Staff ID:</Text><Text style={styles.infoVal}>{selectedLec?.staffID || "N/A"}</Text></View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionHeader}>Assigned Modules</Text>
                {courses.filter(c => c.lec?.toLowerCase() === selectedLec?.email?.toLowerCase()).map((c, i) => (
                    <View key={i} style={styles.dataCard}>
                      <Text style={styles.dataCardTitle}>{c.name}</Text>
                      <Text style={styles.dataCardSub}>{c.code || "No Code"}</Text>
                    </View>
                ))}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionHeader}>Student Ratings</Text>
                {ratings.filter(r => r.lecturerEmail?.toLowerCase() === selectedLec?.email?.toLowerCase()).map((r, i) => (
                    <View key={i} style={styles.dataCard}>
                      <View style={styles.row}>
                        <Text style={styles.dataCardTitle}>{r.courseName}</Text>
                        <Text style={styles.scoreText}>{r.score}/5</Text>
                      </View>
                      <Text style={styles.dataCardSub}>"{r.comment}"</Text>
                    </View>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedLec(null)}><Text style={styles.btnText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  welcomeText: { color: '#f8fafc', fontSize: 22, fontWeight: 'bold' },
  subHeaderText: { color: '#94a3b8', fontSize: 14 },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#ef444422' },
  logoutBtnText: { color: '#ef4444', fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  groupLabel: { color: '#3b82f6', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15 },
  sectionCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: '#334155' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryBtn: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  lecList: { marginBottom: 25 },
  lecBadge: { backgroundColor: '#1e293b', padding: 15, borderRadius: 16, alignItems: 'center', marginRight: 15, width: 110, borderWidth: 1, borderColor: '#334155' },
  avatarCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  lecName: { color: '#e2e8f0', fontSize: 12, fontWeight: 'bold' },
  reportCard: { backgroundColor: '#1e293b', padding: 18, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reportTitle: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  reportSub: { color: '#94a3b8', fontSize: 13, marginBottom: 15 },
  feedbackSection: { backgroundColor: '#0f172a', padding: 12, borderRadius: 10 },
  feedbackLabel: { color: '#3b82f6', fontSize: 10, fontWeight: '900', marginBottom: 4 },
  feedbackContent: { color: '#cbd5e1', fontSize: 13, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  modalContent: { backgroundColor: '#1e293b', width: '90%', maxHeight: '95%', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalSection: { marginBottom: 25 },
  modalSectionHeader: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13 },
  infoVal: { color: '#fff', fontSize: 13 },
  dataCard: { backgroundColor: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  dataCardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  dataCardSub: { color: '#94a3b8', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  scoreText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 14 },
  emptyText: { color: '#64748b', fontStyle: 'italic', fontSize: 12, textAlign: 'center' },
  closeBtn: { backgroundColor: '#334155', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 }
});
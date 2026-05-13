import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, Alert, Modal, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, query, where, addDoc } from "firebase/firestore";
import { signOut } from 'firebase/auth';

export default function PRLDashboard({ navigation }) {
  const [reports, setReports] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [ratings, setRatings] = useState([]);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubReports = onSnapshot(collection(db, "reports"), snap => {
      setReports(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubLecturers = onSnapshot(query(collection(db, "users"), where("role", "==", "Lecturer")), snap => {
      setLecturers(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubCourses = onSnapshot(collection(db, "courses"), snap => {
      setCourses(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubRatings = onSnapshot(collection(db, "ratings"), snap => {
      setRatings(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubReports(); unsubLecturers(); unsubCourses(); unsubRatings(); };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace('Auth');
    } catch (e) { Alert.alert("Error", "Logout failed."); }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return Alert.alert("Required", "Please enter feedback.");
    setIsSubmitting(true);
    try {
      const reportRef = doc(db, "reports", selectedReport.id);
      await updateDoc(reportRef, {
        prlFeedback: feedbackText,
        reviewedByPRL: true,
        verifiedAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        lecturerEmail: selectedReport.lecturerEmail,
        title: "Report Verified",
        message: `Your report for ${selectedReport.courseName} has been verified with feedback.`,
        read: false,
        timestamp: serverTimestamp()
      });

      Alert.alert("Success", "Feedback submitted.");
      setFeedbackText('');
      setSelectedReport(null);
    } catch (e) { Alert.alert("Error", e.message); }
    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Principal Oversight</Text>
          <Text style={styles.subHeaderText}>Stream Quality Assurance</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* SECTION 1: PENDING REPORTS */}
        <Text style={styles.groupLabel}>Action Required: Reports</Text>
        {reports.filter(r => !r.reviewedByPRL).length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>All current reports verified.</Text></View>
        ) : (
          reports.filter(r => !r.reviewedByPRL).map(r => (
            <TouchableOpacity key={r.id} style={styles.reportCard} onPress={() => setSelectedReport(r)}>
              <View style={styles.rowBetween}>
                <Text style={styles.reportTitle}>{r.courseName}</Text>
                <View style={[styles.statusTag, { backgroundColor: '#ca8a04' }]}>
                  <Text style={styles.statusText}>Pending Review</Text>
                </View>
              </View>
              <Text style={styles.reportSub}>Lecturer: {r.lecturerEmail}</Text>
              <Text style={styles.clickHint}>Tap to view & add feedback</Text>
            </TouchableOpacity>
          ))
        )}

        {/* SECTION 2: ENHANCED STREAM MONITORING (DETAILED LIST) */}
        <Text style={styles.groupLabel}>Detailed Stream Monitoring</Text>
        {lecturers.map((lec) => (
          <View key={lec.id} style={styles.monitorCard}>
            <View style={styles.monitorHeader}>
              <View style={styles.lecInfo}>
                <Text style={styles.lecNameText}>{lec.fullName || "Lecturer Name"}</Text>
                <Text style={styles.lecEmailText}>{lec.email}</Text>
              </View>
              <View style={styles.lecBadge}>
                <Text style={styles.lecBadgeText}>{lec.staffID || "ID: N/A"}</Text>
              </View>
            </View>
            
            <View style={styles.moduleList}>
              <Text style={styles.moduleListTitle}>Assigned Modules:</Text>
              {courses.filter(c => c.lec?.toLowerCase() === lec.email?.toLowerCase()).length === 0 ? (
                <Text style={styles.emptyModuleText}>No modules currently assigned.</Text>
              ) : (
                courses.filter(c => c.lec?.toLowerCase() === lec.email?.toLowerCase()).map((course, idx) => (
                  <View key={idx} style={styles.moduleItem}>
                    <Text style={styles.moduleNameText}>{course.name}</Text>
                    <Text style={styles.moduleCodeText}>{course.code || "No Code"}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ))}

        {/* SECTION 3: STUDENT RATINGS */}
        <Text style={styles.groupLabel}>Recent Student Ratings</Text>
        {ratings.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No ratings recorded.</Text></View>
        ) : (
          ratings.map((rating, index) => (
            <View key={index} style={styles.ratingCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.ratingLec}>{rating.lecturerEmail?.split('@')[0]}</Text>
                <Text style={styles.ratingScore}>{rating.score}/5</Text>
              </View>
              <Text style={styles.ratingComment}>"{rating.comment}"</Text>
              <Text style={styles.ratingCourse}>{rating.courseName}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL FOR FEEDBACK */}
      <Modal visible={!!selectedReport} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Report Review</Text>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Module:</Text>
                <Text style={styles.detailValue}>{selectedReport?.courseName}</Text>
                <Text style={styles.detailLabel}>Lecturer:</Text>
                <Text style={styles.detailValue}>{selectedReport?.lecturerEmail}</Text>
                <Text style={styles.detailLabel}>Topic Taught:</Text>
                <Text style={styles.detailValue}>{selectedReport?.topicTaught || "N/A"}</Text>
              </View>

              <Text style={styles.inputLabel}>Quality Feedback</Text>
              <TextInput 
                style={styles.textArea}
                placeholder="Enter feedback for the lecturer..."
                placeholderTextColor="#64748b"
                multiline
                value={feedbackText}
                onChangeText={setFeedbackText}
              />

              <TouchableOpacity style={styles.verifyBtn} onPress={submitFeedback}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Send Feedback</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedReport(null)}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  welcomeText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subHeaderText: { color: '#94a3b8', fontSize: 13 },
  logoutBtn: { backgroundColor: '#ef444422', padding: 8, borderRadius: 8 },
  logoutBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  scrollContent: { padding: 20 },
  groupLabel: { color: '#3b82f6', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15, marginTop: 15 },
  
  // Monitoring Card
  monitorCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  monitorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 12 },
  lecInfo: { flex: 1 },
  lecNameText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  lecEmailText: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  lecBadge: { backgroundColor: '#3b82f622', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  lecBadgeText: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
  
  // Module List inside Monitoring
  moduleList: { marginTop: 12 },
  moduleListTitle: { color: '#3b82f6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  moduleItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: 10, borderRadius: 8, marginBottom: 6 },
  moduleNameText: { color: '#f8fafc', fontSize: 13, flex: 1 },
  moduleCodeText: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
  emptyModuleText: { color: '#64748b', fontSize: 12, fontStyle: 'italic' },

  // Report Cards
  reportCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  reportSub: { color: '#94a3b8', fontSize: 13, marginTop: 5 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  clickHint: { color: '#3b82f6', fontSize: 11, marginTop: 12, fontWeight: '600' },
  
  // Ratings
  ratingCard: { backgroundColor: '#0f172a', padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#fbbf24' },
  ratingLec: { color: '#fff', fontWeight: 'bold' },
  ratingScore: { color: '#fbbf24', fontWeight: 'bold' },
  ratingComment: { color: '#cbd5e1', fontSize: 13, fontStyle: 'italic', marginVertical: 8 },
  ratingCourse: { color: '#64748b', fontSize: 11 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1e293b', width: '90%', maxHeight: '80%', padding: 25, borderRadius: 24, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  detailBox: { backgroundColor: '#0f172a', padding: 15, borderRadius: 12, marginBottom: 20 },
  detailLabel: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  detailValue: { color: '#fff', fontSize: 14, marginBottom: 12, marginTop: 2 },
  inputLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 8, fontWeight: 'bold' },
  textArea: { backgroundColor: '#0f172a', color: '#fff', padding: 15, borderRadius: 12, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155' },
  verifyBtn: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { padding: 15, alignItems: 'center' },
  closeBtnText: { color: '#94a3b8' },
  emptyCard: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 13 }
});
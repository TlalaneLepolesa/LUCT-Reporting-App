import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { db } from './firebaseConfig';
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function PRLDashboard() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    // Listen for all submitted lecture reports in real-time
    const unsub = onSnapshot(collection(db, "reports"), (snap) => {
      const fetchedReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort the newest reports are at the top
      fetchedReports.sort((a, b) => b.timestamp - a.timestamp);
      setReports(fetchedReports);
    });
    return () => unsub();
  }, []);

  // Function to submit the official PRL feedback
  const submitReview = async () => {
    if (!feedbackText.trim()) {
      return Alert.alert("Required", "Please enter your feedback before submitting.");
    }
    
    try {
      const reportRef = doc(db, "reports", selectedReport.id);
      await updateDoc(reportRef, {
        prlFeedback: feedbackText,
        reviewedByPRL: true
      });
      
      Alert.alert("Success", "Feedback submitted to Lecturer.");
      setSelectedReport(null); // Close the modal
      setFeedbackText(''); // Clear the text input
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Split reports into two categories for a realistic workflow
  const pendingReports = reports.filter(r => !r.reviewedByPRL);
  const reviewedReports = reports.filter(r => r.reviewedByPRL);

  return (
    <ScrollView style={styles.background} contentContainerStyle={{paddingBottom: 50}}>
      <View style={styles.container}>
        <Text style={styles.header}>PRL Review Portal</Text>

        {/* SECTION 1: Action Required (Pending) */}
        <Text style={styles.sectionTitle}>Action Required: Pending Reviews</Text>
        {pendingReports.length === 0 ? <Text style={styles.emptyText}>No pending reports.</Text> :
          pendingReports.map(r => (
            <View key={r.id} style={[styles.card, { borderLeftColor: '#FFC107' }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{r.courseName || "Unnamed Course"}</Text>
                <Text style={styles.statusBadgePending}>Pending</Text>
              </View>
              <Text style={styles.cardSub}>Lecturer: {r.lecturerEmail}</Text>
              <Text style={styles.cardSub}>Date: {r.dateOfLecture || "N/A"}</Text>
              <TouchableOpacity style={styles.reviewBtn} onPress={() => { setSelectedReport(r); setFeedbackText(''); }}>
                <Text style={styles.btnText}>Review Report</Text>
              </TouchableOpacity>
            </View>
          ))
        }

        {/* SECTION 2: Completed Reviews */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Completed Reviews</Text>
        {reviewedReports.length === 0 ? <Text style={styles.emptyText}>No reviewed reports yet.</Text> :
          reviewedReports.map(r => (
            <View key={r.id} style={[styles.card, { borderLeftColor: '#4CAF50' }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{r.courseName}</Text>
                <Text style={styles.statusBadgeDone}>Reviewed</Text>
              </View>
              <Text style={styles.cardSub}>Lecturer: {r.lecturerEmail}</Text>
              <Text style={styles.cardSub}>Topic: {r.topicTaught}</Text>
              <View style={styles.feedbackBox}>
                <Text style={styles.fbLabel}>YOUR FEEDBACK:</Text>
                <Text style={styles.fbText}>"{r.prlFeedback}"</Text>
              </View>
            </View>
          ))
        }

        {/* REVIEW MODAL: The actual workspace for the PRL to leave comments */}
        <Modal visible={!!selectedReport} transparent animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Official Report Review</Text>
              
              <View style={styles.infoBox}>
                <Text style={styles.modalText}><Text style={styles.boldText}>Course:</Text> {selectedReport?.courseName}</Text>
                <Text style={styles.modalText}><Text style={styles.boldText}>Lecturer:</Text> {selectedReport?.lecturerEmail}</Text>
                <Text style={styles.modalText}><Text style={styles.boldText}>Date:</Text> {selectedReport?.dateOfLecture}</Text>
                <Text style={styles.modalText}><Text style={styles.boldText}>Topic:</Text> {selectedReport?.topicTaught}</Text>
                
                {/* Realistic Attendance Stats */}
                <Text style={[styles.modalText, { marginTop: 10, color: '#FF69B4', fontWeight: 'bold' }]}>
                  Attendance: {selectedReport?.totalPresent || 0} / {selectedReport?.totalRegistered || 0} Present
                </Text>
              </View>

              <Text style={styles.fbLabel}>ENTER PRL FEEDBACK:</Text>
              <TextInput 
                style={styles.textArea} 
                multiline={true} 
                numberOfLines={4}
                placeholder="Type your official feedback to the lecturer here..."
                placeholderTextColor="#666"
                value={feedbackText}
                onChangeText={setFeedbackText}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#333' }]} onPress={() => setSelectedReport(null)}>
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF69B4' }]} onPress={submitReview}>
                  <Text style={styles.btnText}>Submit Review</Text>
                </TouchableOpacity>
              </View>

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
  header: { fontSize: 26, color: '#FF69B4', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
  emptyText: { color: '#888', fontStyle: 'italic', marginBottom: 20 },
  
  card: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, flex: 1 },
  statusBadgePending: { backgroundColor: '#FFC10722', color: '#FFC107', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 10, fontWeight: 'bold', overflow: 'hidden' },
  statusBadgeDone: { backgroundColor: '#4CAF5022', color: '#4CAF50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 10, fontWeight: 'bold', overflow: 'hidden' },
  cardSub: { color: '#aaa', fontSize: 13, marginBottom: 4 },
  
  reviewBtn: { backgroundColor: '#333', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#555' },
  feedbackBox: { marginTop: 12, padding: 10, backgroundColor: '#121212', borderRadius: 8 },
  fbLabel: { color: '#FF69B4', fontSize: 11, fontWeight: 'bold', marginBottom: 5, marginTop: 5 },
  fbText: { color: '#ddd', fontSize: 14, fontStyle: 'italic' },
  
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1e1e1e', width: '90%', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#444' },
  modalTitle: { color: '#FF69B4', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  infoBox: { backgroundColor: '#121212', padding: 15, borderRadius: 8, marginBottom: 15 },
  modalText: { color: '#ddd', fontSize: 14, marginBottom: 6 },
  boldText: { fontWeight: 'bold', color: '#fff' },
  textArea: { backgroundColor: '#121212', color: '#fff', padding: 15, borderRadius: 8, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
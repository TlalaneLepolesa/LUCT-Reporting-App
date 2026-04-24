import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Text, View, KeyboardAvoidingView, Platform, Alert, Switch, ActivityIndicator } from 'react-native';
import { db, auth } from './firebaseConfig'; // Added auth 
import { collection, addDoc, getDocs, query, where, onSnapshot } from "firebase/firestore"; 

export default function LecturerForm() {
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentList, setStudentList] = useState([]);
  const [attendanceRecord, setAttendanceRecord] = useState({});
  const [messages, setMessages] = useState([]); // To store PRL feedback

  const [formData, setFormData] = useState({
    facultyName: 'FICT',
    className: '',
    weekOfReporting: '',
    dateOfLecture: '',
    courseName: '',
    courseCode: '',
    topicTaught: '',
  });

  useEffect(() => {
    // 1. Fetch Students
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "Student"));
        const querySnapshot = await getDocs(q);
        let fetchedStudents = [];
        let initialAttendance = {};

        querySnapshot.forEach((doc) => {
          const studentData = doc.data();
          fetchedStudents.push({ id: doc.id, email: studentData.email });
          initialAttendance[studentData.email] = true; 
        });

        setStudentList(fetchedStudents);
        setAttendanceRecord(initialAttendance);
      } catch (error) {
        Alert.alert("Error fetching students", error.message);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();

    // 2. Fetch Messages from PRL
    if (auth.currentUser?.email) {
      const qMsg = query(
        collection(db, "reports"), 
        where("lecturerEmail", "==", auth.currentUser.email),
        where("reviewedByPRL", "==", true)
      );
      const unsub = onSnapshot(qMsg, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, []);

  const toggleAttendance = (studentEmail) => {
    setAttendanceRecord(prevState => ({
      ...prevState,
      [studentEmail]: !prevState[studentEmail]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.courseName || !formData.dateOfLecture) {
      Alert.alert("Missing Fields", "Please fill in the Course Name and Date.");
      return;
    }

    try {
      const totalRegistered = studentList.length;
      const totalPresent = Object.values(attendanceRecord).filter(status => status === true).length;

      const finalReport = {
        ...formData,
        lecturerEmail: auth.currentUser?.email || "unknown@lecturer.com", // Crucial for connection
        prlFeedback: "", // Empty slot for PRL
        reviewedByPRL: false,
        totalRegisteredStudents: totalRegistered,
        studentsPresent: totalPresent,
        attendanceDetails: attendanceRecord,
        timestamp: new Date()
      };

      await addDoc(collection(db, "reports"), finalReport);
      Alert.alert("Success", "Report & Attendance submitted successfully!");
      setFormData({ ...formData, className: '', weekOfReporting: '', dateOfLecture: '', courseName: '', courseCode: '', topicTaught: '' });
      
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.background} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollCenter}>
        <View style={styles.responsiveContainer}>
          <Text style={styles.title}>Submit Class Report</Text>

          {/* COMMUNICATION LOOP: Messages from PRL */}
          {messages.length > 0 && (
            <View style={styles.messageBox}>
              <Text style={styles.messageTitle}>Messages from Principal Lecturer:</Text>
              {messages.map(msg => (
                <Text key={msg.id} style={styles.messageText}>
                  {msg.courseName}: "{msg.prlFeedback}"
                </Text>
              ))}
            </View>
          )}
          
          <TextInput placeholder="Class Name" placeholderTextColor="#888" style={styles.input} onChangeText={(v) => setFormData({...formData, className: v})} value={formData.className} />
          <TextInput placeholder="Course Name" placeholderTextColor="#888" style={styles.input} onChangeText={(v) => setFormData({...formData, courseName: v})} value={formData.courseName} />
          <TextInput placeholder="Course Code" placeholderTextColor="#888" style={styles.input} onChangeText={(v) => setFormData({...formData, courseCode: v})} value={formData.courseCode} />
          <TextInput placeholder="Date of Lecture (YYYY-MM-DD)" placeholderTextColor="#888" style={styles.input} onChangeText={(v) => setFormData({...formData, dateOfLecture: v})} value={formData.dateOfLecture} />
          <TextInput placeholder="Topic Taught" placeholderTextColor="#888" style={styles.input} onChangeText={(v) => setFormData({...formData, topicTaught: v})} value={formData.topicTaught} />

          <Text style={styles.sectionTitle}>Attendance Register</Text>
          <View style={styles.attendanceBox}>
            {loadingStudents ? (
              <ActivityIndicator color="#538cf7" />
            ) : studentList.length === 0 ? (
              <Text style={{color: '#888'}}>No students found in the database.</Text>
            ) : (
              studentList.map((student) => (
                <View key={student.id} style={styles.studentRow}>
                  <Text style={styles.studentName}>{student.email?.split('@')[0]}</Text>
                  <View style={styles.toggleGroup}>
                    <Text style={{color: attendanceRecord[student.email] ? '#00FF00' : '#FF0000', marginRight: 10, fontWeight: 'bold'}}>
                      {attendanceRecord[student.email] ? 'Present' : 'Absent'}
                    </Text>
                    <Switch
                      trackColor={{ false: "#767577", true: "#538cf7" }}
                      thumbColor="#f4f3f4"
                      onValueChange={() => toggleAttendance(student.email)}
                      value={attendanceRecord[student.email]}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
          
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.btnText}>Submit Report & Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#121212' },
  scrollCenter: { flexGrow: 1, alignItems: 'center', paddingVertical: 20 },
  responsiveContainer: { width: '100%', maxWidth: 600, paddingHorizontal: 20 },
  title: { fontSize: 24, color: '#538cf7', marginBottom: 20, fontWeight: 'bold', textAlign: 'center' },
  messageBox: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#538cf7' },
  messageTitle: { color: '#538cf7', fontWeight: 'bold', marginBottom: 5 },
  messageText: { color: '#ddd', fontSize: 13, fontStyle: 'italic', marginBottom: 5 },
  sectionTitle: { fontSize: 18, color: '#fff', marginTop: 20, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#1e1e1e', color: '#fff', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  attendanceBox: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 8, marginBottom: 20 },
  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  studentName: { color: '#ddd', fontSize: 16 },
  toggleGroup: { flexDirection: 'row', alignItems: 'center' },
  submitBtn: { backgroundColor: '#538cf7', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 40 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

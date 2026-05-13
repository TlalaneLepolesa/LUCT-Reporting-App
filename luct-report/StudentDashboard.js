import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, SafeAreaView, TextInput, ActivityIndicator 
} from 'react-native';
import { db, auth } from './firebaseConfig';
import { collection, onSnapshot, addDoc, doc, serverTimestamp } from "firebase/firestore";
import { signOut } from 'firebase/auth';

export default function StudentDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState('menu');
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [courses, setCourses] = useState([]);

  // Rating State
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [ratingScore, setRatingScore] = useState('');
  const [comment, setComment] = useState('');

  // Profile Data (Read-Only)
  const [studentProfile, setStudentProfile] = useState({});

  useEffect(() => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return;

    // Fetch Student Profile from Firestore
    const unsubProfile = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setStudentProfile(doc.data());
    });

    // Real-Time Attendance Monitoring
    const unsubReports = onSnapshot(collection(db, "reports"), (snap) => {
      let stats = {};
      snap.forEach(doc => {
        const data = doc.data();
        const course = data.courseName || "Unknown Module";
        if (!stats[course]) stats[course] = { total: 0, attended: 0 };
        
        if (data.attendanceDetails && data.attendanceDetails[userEmail] !== undefined) {
          stats[course].total += 1;
          if (data.attendanceDetails[userEmail] === true) stats[course].attended += 1;
        }
      });
      
      const formatted = Object.keys(stats).map(name => {
        const total = stats[name].total;
        const attended = stats[name].attended;
        const percentage = total > 0 ? ((attended / total) * 100).toFixed(1) : "0.0";
        return { name, percent: percentage };
      });
      setAttendanceData(formatted);
    });

    // Course list monitoring
    const unsubCourses = onSnapshot(collection(db, "courses"), (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubReports(); unsubCourses(); unsubProfile(); };
  }, []);

  const submitRating = async () => {
    if (!ratingScore || !comment) return Alert.alert("Required", "Please provide a score (1-5) and a comment.");
    setLoading(true);
    try {
      await addDoc(collection(db, "ratings"), {
        lecturerEmail: selectedLecturer.lec,
        courseName: selectedLecturer.name,
        score: ratingScore,
        comment: comment,
        timestamp: serverTimestamp(),
      });
      Alert.alert("Thank You", "Your anonymous feedback has been sent.");
      setRatingScore('');
      setComment('');
      setActiveTab('menu');
    } catch (e) { Alert.alert("Error", e.message); }
    setLoading(false);
  };

  const renderHeader = (title) => (
    <View style={styles.header}>
      <View>
        <Text style={styles.welcomeText}>{title}</Text>
        <Text style={styles.subHeaderText}>ID: {studentProfile.studentID || auth.currentUser?.email.split('@')[0]}</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await signOut(auth); navigation.replace('Auth'); }}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  // --- MENU ---
  if (activeTab === 'menu') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Academic Hub")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.groupLabel}>Academic Monitoring</Text>
        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('attendance')}>
          <Text style={styles.cardTitle}>Attendance Tracker</Text>
          <Text style={styles.cardSub}>View your presence records</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('monitoring')}>
          <Text style={styles.cardTitle}>My Modules</Text>
          <Text style={styles.cardSub}>View your current semester courses</Text>
        </TouchableOpacity>

        <Text style={styles.groupLabel}>Student Services</Text>
        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('rating-list')}>
          <Text style={styles.cardTitle}>Rate Lecturers</Text>
          <Text style={styles.cardSub}>Leave anonymous performance feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('profile')}>
          <Text style={styles.cardTitle}>My Profile</Text>
          <Text style={styles.cardSub}>View registration & class details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // --- ATTENDANCE ---
  if (activeTab === 'attendance') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Attendance Status")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {attendanceData.length === 0 ? (
          <View style={styles.emptyBox}><Text style={styles.emptyText}>No attendance records found.</Text></View>
        ) : attendanceData.map((item, index) => (
          <View key={index} style={styles.statsCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.reportTitle}>{item.name}</Text>
              <Text style={[styles.percentText, { color: parseFloat(item.percent) < 80 ? '#f43f5e' : '#3b82f6' }]}>{item.percent}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.percent}%`, backgroundColor: parseFloat(item.percent) < 80 ? '#f43f5e' : '#3b82f6' }]} />
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('menu')}><Text style={styles.btnText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // --- MODULES ---
  if (activeTab === 'monitoring') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Module List")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {courses.map(c => (
          <View key={c.id} style={styles.courseDetailCard}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseCodeLabel}>{c.code}</Text>
              <Text style={styles.facultyLabel}>{c.faculty}</Text>
            </View>
            <Text style={styles.courseNameLarge}>{c.name}</Text>
            <Text style={styles.lecturerEmailLabel}>Lecturer: {c.lec}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('menu')}><Text style={styles.btnText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // --- RATING LIST ---
  if (activeTab === 'rating-list') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Select Lecturer")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {courses.map(c => (
          <TouchableOpacity key={c.id} style={styles.actionCard} onPress={() => { setSelectedLecturer(c); setActiveTab('rating-form'); }}>
            <Text style={styles.cardTitle}>{c.lec}</Text>
            <Text style={styles.cardSub}>Module: {c.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('menu')}><Text style={styles.btnText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // --- RATING FORM ---
  if (activeTab === 'rating-form') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Leave Rating")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionCard}>
          <Text style={styles.reportTitle}>Lecturer: {selectedLecturer?.lec}</Text>
          <Text style={styles.cardSub}>This feedback is completely anonymous.</Text>
          <TextInput placeholder="Score (1-5)" placeholderTextColor="#64748b" keyboardType="numeric" style={styles.input} value={ratingScore} onChangeText={setRatingScore} />
          <TextInput placeholder="Write your comments here..." placeholderTextColor="#64748b" style={[styles.input, { height: 120 }]} multiline value={comment} onChangeText={setComment} />
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={submitRating}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Anonymous Rating</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('rating-list')}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // --- READ ONLY PROFILE ---
  if (activeTab === 'profile') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Student Profile")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
             <Text style={styles.avatarText}>{studentProfile.fullName?.charAt(0) || "S"}</Text>
          </View>
          <Text style={styles.profileName}>{studentProfile.fullName}</Text>
          <Text style={styles.profileRole}>{studentProfile.role}</Text>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Student ID</Text><Text style={styles.infoValue}>{studentProfile.studentID || "N/A"}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Class Group</Text><Text style={styles.infoValue}>{studentProfile.currentClass || "N/A"}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Degree Program</Text><Text style={styles.infoValue}>{studentProfile.degreeName || "N/A"}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>University Email</Text><Text style={styles.infoValue}>{studentProfile.email}</Text></View>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('menu')}><Text style={styles.btnText}>Return to Dashboard</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 25, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subHeaderText: { color: '#94a3b8', fontSize: 12 },
  logoutBtn: { backgroundColor: '#f43f5e22', padding: 8, borderRadius: 8 },
  logoutBtnText: { color: '#f43f5e', fontWeight: 'bold', fontSize: 12 },
  scrollContent: { padding: 20 },
  groupLabel: { color: '#3b82f6', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },
  courseDetailCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  courseCodeLabel: { backgroundColor: '#3b82f622', color: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  facultyLabel: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  courseNameLarge: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  lecturerEmailLabel: { color: '#94a3b8', fontSize: 13 },
  statsCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reportTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  percentText: { fontSize: 20, fontWeight: '900' },
  progressBar: { height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%' },
  sectionCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 20 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  primaryBtn: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  backBtn: { padding: 20, alignItems: 'center' },
  actionCard: { backgroundColor: '#1e293b', padding: 25, borderRadius: 20, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: '#3b82f6' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardSub: { color: '#94a3b8', fontSize: 13, marginTop: 5 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center' },
  profileCard: { backgroundColor: '#1e293b', padding: 25, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  profileName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  profileRole: { color: '#3b82f6', fontSize: 14, marginTop: 4, fontWeight: '600' },
  divider: { width: '100%', height: 1, backgroundColor: '#334155', marginVertical: 20 },
  infoRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoLabel: { color: '#94a3b8', fontSize: 13 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
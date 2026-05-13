import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  Text, View, SafeAreaView, Alert, Switch, ActivityIndicator 
} from 'react-native';
import { db, auth } from './firebaseConfig'; 
import { collection, addDoc, getDocs, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from "firebase/firestore"; 
import { signOut } from 'firebase/auth';

export default function LecturerDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState('menu'); 
  const [loading, setLoading] = useState(false);
  
  const [studentList, setStudentList] = useState([]);
  const [attendanceRecord, setAttendanceRecord] = useState({});
  const [myCourses, setMyCourses] = useState([]);
  
  // NEW STATES FOR MONITORING & RATING
  const [pastReports, setPastReports] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [editingReportId, setEditingReportId] = useState(null);

  const [reportForm, setReportForm] = useState({
    facultyName: 'FICT', 
    className: '',
    weekOfReporting: '',
    dateOfLecture: '',
    courseName: '',
    courseCode: '',
    lecturerName: '',
    venue: '',
    scheduledTime: '',
    topicTaught: '',
    learningOutcomes: '',
    recommendations: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const email = auth.currentUser.email;

    // 1. CLASSES: Pull assigned modules
    const qCourses = query(collection(db, "courses"), where("lec", "==", email));
    const unsubCourses = onSnapshot(qCourses, (snap) => {
      setMyCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. MONITORING: Pull past reports for this lecturer
    const qReports = query(collection(db, "reports"), where("lecturerEmail", "==", email));
    const unsubReports = onSnapshot(qReports, (snap) => {
      setPastReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. RATING: Pull anonymous ratings
    const qRatings = query(collection(db, "ratings"), where("lecturerEmail", "==", email));
    const unsubRatings = onSnapshot(qRatings, (snap) => {
      setMyRatings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubCourses(); unsubReports(); unsubRatings(); };
  }, []);

  const handleSignOut = async () => {
    try { await signOut(auth); navigation.replace('Login'); } catch (e) { Alert.alert("Error", "Logout failed."); }
  };

  const loadAttendanceRegister = async () => {
    if (!reportForm.courseName || !reportForm.topicTaught || !reportForm.className) {
      return Alert.alert("Missing Fields", "Please complete the Academic Details section first.");
    }
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "Student"));
      const snap = await getDocs(q);
      let list = [];
      let initialAtt = {};
      snap.forEach(doc => {
        list.push({ id: doc.id, email: doc.data().email });
        initialAtt[doc.data().email] = true; 
      });
      setStudentList(list);
      setAttendanceRecord(initialAtt);
      setActiveTab('attendance');
    } catch (e) { Alert.alert("Error", e.message); }
    setLoading(false);
  };

  const submitFinalReport = async () => {
    try {
      setLoading(true);
      const presentCount = Object.values(attendanceRecord).filter(v => v).length;
      
      // If we are editing a past report
      if (editingReportId) {
        await updateDoc(doc(db, "reports", editingReportId), {
          attendanceDetails: attendanceRecord,
          actualPresent: presentCount,
          lastEdited: serverTimestamp()
        });
        Alert.alert("Update Successful", "The attendance register has been modified.");
        setEditingReportId(null);
      } else {
        // Normal submission
        await addDoc(collection(db, "reports"), {
          ...reportForm,
          lecturerEmail: auth.currentUser.email,
          attendanceDetails: attendanceRecord,
          actualPresent: presentCount,
          totalRegistered: studentList.length,
          reviewedByPRL: false,
          timestamp: serverTimestamp()
        });
        Alert.alert("Submission Successful", "The academic report and attendance have been logged.");
      }

      setActiveTab('menu');
      setReportForm({ facultyName: 'FICT', className: '', weekOfReporting: '', dateOfLecture: '', courseName: '', courseCode: '', lecturerName: '', venue: '', scheduledTime: '', topicTaught: '', learningOutcomes: '', recommendations: '' });
    } catch (e) { Alert.alert("Error", e.message); }
    setLoading(false);
  };

  const renderHeader = (title) => (
    <View style={styles.header}>
      <View>
        <Text style={styles.welcomeText}>{title}</Text>
        <Text style={styles.subHeaderText}>FICT Academic System</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}><Text style={styles.logoutBtnText}>Exit</Text></TouchableOpacity>
    </View>
  );

  // --- MENU ---
  if (activeTab === 'menu') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Lecturer Hub")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.groupLabel}>Class Management</Text>
        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('classes')}>
          <Text style={styles.cardTitle}>My Classes</Text>
          <Text style={styles.cardSub}>Assigned by Program Leader</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('reports')}>
          <Text style={styles.cardTitle}>New Report</Text>
          <Text style={styles.cardSub}>Submit 14-point log & Attendance</Text>
        </TouchableOpacity>

        <Text style={styles.groupLabel}>Academic Monitoring</Text>
        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('monitoring')}>
          <Text style={styles.cardTitle}>Monitoring</Text>
          <Text style={styles.cardSub}>View and Edit past attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('ratings')}>
          <Text style={styles.cardTitle}>My Ratings</Text>
          <Text style={styles.cardSub}>Anonymous student feedback</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // --- CLASSES ---
  if (activeTab === 'classes') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Assigned Modules")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {myCourses.map(c => (
          <View key={c.id} style={styles.infoCard}>
            <Text style={styles.reportTitle}>{c.name}</Text>
            <Text style={styles.reportSub}>Code: {c.code} | Faculty: {c.faculty}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('menu')}><Text style={styles.btnText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // --- MONITORING (LIST OF PAST REPORTS) ---
  if (activeTab === 'monitoring') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Monitoring")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {pastReports.map(r => (
          <View key={r.id} style={styles.infoCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.reportTitle}>{r.courseName}</Text>
              <Text style={styles.percentText}>{r.actualPresent}/{r.totalRegistered}</Text>
            </View>
            <Text style={styles.reportSub}>Week: {r.weekOfReporting} | Date: {r.dateOfLecture}</Text>
            <TouchableOpacity 
               style={styles.editBtn} 
               onPress={() => {
                 setEditingReportId(r.id);
                 setAttendanceRecord(r.attendanceDetails);
                 // Need the student list to match the emails in the attendance record
                 setStudentList(Object.keys(r.attendanceDetails).map(email => ({ id: email, email })));
                 setActiveTab('attendance');
               }}
            >
              <Text style={styles.editBtnText}>Edit Student Attendance</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('menu')}><Text style={styles.btnText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // --- RATINGS ---
  if (activeTab === 'ratings') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("My Ratings")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {myRatings.length === 0 ? <Text style={styles.emptyText}>No ratings available.</Text> : 
          myRatings.map(rt => (
            <View key={rt.id} style={styles.ratingCard}>
              <Text style={styles.ratingScore}>Score: {rt.score}/5</Text>
              <Text style={styles.commentText}>"{rt.comment}"</Text>
              <Text style={styles.anonLabel}>— Anonymous Submission</Text>
            </View>
          ))
        }
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('menu')}><Text style={styles.btnText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // --- REPORTS FORM & ATTENDANCE Marking/Editing ---
  // (Uses your existing logic for reports and attendance)
  if (activeTab === 'reports') return (
    <SafeAreaView style={styles.container}>
      {renderHeader("Report Entry")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.groupLabel}>Academic Identity</Text>
        <View style={styles.sectionCard}>
          <TextInput placeholder="Faculty Name" placeholderTextColor="#64748b" style={styles.input} value={reportForm.facultyName} onChangeText={v => setReportForm({...reportForm, facultyName: v})} />
          <TextInput placeholder="Lecturer's Full Name" placeholderTextColor="#64748b" style={styles.input} value={reportForm.lecturerName} onChangeText={v => setReportForm({...reportForm, lecturerName: v})} />
        </View>

        <Text style={styles.groupLabel}>Class & Timing</Text>
        <View style={styles.sectionCard}>
          <TextInput placeholder="Class Name (e.g. SE Year 3)" placeholderTextColor="#64748b" style={styles.input} value={reportForm.className} onChangeText={v => setReportForm({...reportForm, className: v})} />
          <TextInput placeholder="Week of Reporting" placeholderTextColor="#64748b" style={styles.input} value={reportForm.weekOfReporting} onChangeText={v => setReportForm({...reportForm, weekOfReporting: v})} />
          <TextInput placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#64748b" style={styles.input} value={reportForm.dateOfLecture} onChangeText={v => setReportForm({...reportForm, dateOfLecture: v})} />
          <TextInput placeholder="Scheduled Time" placeholderTextColor="#64748b" style={styles.input} value={reportForm.scheduledTime} onChangeText={v => setReportForm({...reportForm, scheduledTime: v})} />
          <TextInput placeholder="Venue" placeholderTextColor="#64748b" style={styles.input} value={reportForm.venue} onChangeText={v => setReportForm({...reportForm, venue: v})} />
        </View>

        <Text style={styles.groupLabel}>Module Content</Text>
        <View style={styles.sectionCard}>
          <TextInput placeholder="Course Name" placeholderTextColor="#64748b" style={styles.input} value={reportForm.courseName} onChangeText={v => setReportForm({...reportForm, courseName: v})} />
          <TextInput placeholder="Course Code" placeholderTextColor="#64748b" style={styles.input} value={reportForm.courseCode} onChangeText={v => setReportForm({...reportForm, courseCode: v})} />
          <TextInput placeholder="Topic Taught" placeholderTextColor="#64748b" style={styles.input} value={reportForm.topicTaught} onChangeText={v => setReportForm({...reportForm, topicTaught: v})} />
          <TextInput placeholder="Learning Outcomes" placeholderTextColor="#64748b" style={[styles.input, {height: 80}]} multiline value={reportForm.learningOutcomes} onChangeText={v => setReportForm({...reportForm, learningOutcomes: v})} />
          <TextInput placeholder="Lecturer's Recommendations" placeholderTextColor="#64748b" style={[styles.input, {height: 80}]} multiline value={reportForm.recommendations} onChangeText={v => setReportForm({...reportForm, recommendations: v})} />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={loadAttendanceRegister}>
          <Text style={styles.btnText}>Continue to Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setEditingReportId(null); setActiveTab('menu'); }}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  if (activeTab === 'attendance') return (
    <SafeAreaView style={styles.container}>
      {renderHeader(editingReportId ? "Edit Attendance" : "Mark Attendance")}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Present: {Object.values(attendanceRecord).filter(v => v).length}</Text>
          <Text style={styles.statLabel}>Total: {studentList.length}</Text>
        </View>
        <View style={styles.sectionCard}>
          {studentList.map(s => (
            <View key={s.id} style={styles.attRow}>
              <Text style={styles.studentEmail}>{s.email.split('@')[0]}</Text>
              <Switch 
                value={attendanceRecord[s.email]} 
                onValueChange={() => setAttendanceRecord({...attendanceRecord, [s.email]: !attendanceRecord[s.email]})} 
                trackColor={{ false: "#334155", true: "#3b82f6" }}
              />
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={submitFinalReport}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{editingReportId ? "Save Changes" : "Submit Full Report"}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab(editingReportId ? 'monitoring' : 'reports')}><Text style={styles.btnText}>Back</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  return null;
}

// STYLES (Added new ones for monitoring/ratings)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  welcomeText: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold' },
  subHeaderText: { color: '#94a3b8', fontSize: 12 },
  logoutBtn: { padding: 8, backgroundColor: '#ef444422', borderRadius: 8 },
  logoutBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  groupLabel: { color: '#3b82f6', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 15, marginTop: 10 },
  actionCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  cardSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  sectionCard: { backgroundColor: '#1e293b', padding: 15, borderRadius: 16, marginBottom: 20 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  primaryBtn: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  backBtn: { padding: 20, alignItems: 'center' },
  infoCard: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, marginBottom: 10 },
  reportTitle: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold' },
  reportSub: { color: '#94a3b8', fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statLabel: { color: '#fff', fontWeight: 'bold' },
  attRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  studentEmail: { color: '#fff' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  percentText: { color: '#3b82f6', fontWeight: 'bold' },
  editBtn: { backgroundColor: '#334155', padding: 10, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  ratingCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 15, marginBottom: 15, borderBottomWidth: 3, borderBottomColor: '#3b82f6' },
  ratingScore: { color: '#3b82f6', fontWeight: 'bold', fontSize: 18 },
  commentText: { color: '#cbd5e1', fontStyle: 'italic', marginTop: 10, fontSize: 14 },
  anonLabel: { color: '#64748b', fontSize: 10, marginTop: 10, textAlign: 'right' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40 }
});
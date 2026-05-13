import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  View, TextInput, StyleSheet, Text, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';

// Firebase Imports
import { auth, db } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Screen Imports
import LecturerForm from './LecturerForm';
import StudentDashboard from './StudentDashboard';
import PRLDashboard from './PRLDashboard'; 
import PLDashboard from './PLDashboard';

const Stack = createStackNavigator();

function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration Fields
  const [role, setRole] = useState('Student');
  const [fullName, setFullName] = useState('');
  
  // Student Specific
  const [studentID, setStudentID] = useState('');
  const [currentClass, setCurrentClass] = useState('');
  const [degreeName, setDegreeName] = useState('');
  
  // Staff Specific
  const [staffID, setStaffID] = useState('');
  const [faculty, setFaculty] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      return Alert.alert("Required Fields", "Please enter both email and password.");
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role;

          // REDIRECTION LOGIC (Now Correctly Active)
          if (userRole === 'Lecturer') navigation.replace('LecturerForm');
          else if (userRole === 'Student') navigation.replace('StudentDashboard');
          else if (userRole === 'PRL') navigation.replace('PRLDashboard');
          else if (userRole === 'PL') navigation.replace('PLDashboard');
          else navigation.replace('LecturerForm'); // Default fallback
          
        } else {
          Alert.alert("Error", "No profile found in the database.");
        }
      } else {
        // --- REGISTRATION LOGIC ---
        if (!fullName) return Alert.alert("Required", "Please enter your full name.");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        let userData = {
          uid: user.uid,
          email: email.trim().toLowerCase(),
          fullName,
          role,
          createdAt: serverTimestamp()
        };

        if (role === 'Student') {
          userData = { ...userData, studentID, currentClass, degreeName };
        } else {
          userData = { ...userData, staffID, faculty };
        }

        await setDoc(doc(db, "users", user.uid), userData);
        Alert.alert("Success", "Account created!");
        
        // Auto-route after registration
        if (role === 'Student') navigation.replace('StudentDashboard');
        else if (role === 'PL') navigation.replace('PLDashboard');
        else if (role === 'PRL') navigation.replace('PRLDashboard');
        else navigation.replace('LecturerForm');
      }
    } catch (error) {
      Alert.alert("Authentication Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.brandContainer}>
          <Text style={styles.logoText}>LUCT</Text>
          <Text style={styles.header}>{isLogin ? 'Portal Sign In' : 'Account Registration'}</Text>
        </View>

        <View style={styles.inputContainer}>
          {!isLogin && (
            <>
              <Text style={styles.label}>Select Role</Text>
              <View style={styles.roleContainer}>
                {['Student', 'Lecturer', 'PL', 'PRL'].map((r) => (
                  <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]} onPress={() => setRole(r)}>
                    <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#666" value={fullName} onChangeText={setFullName} />
            </>
          )}

          <Text style={styles.label}>University Email</Text>
          <TextInput style={styles.input} placeholder="name@luct.ac.ls" placeholderTextColor="#666" onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#666" secureTextEntry onChangeText={setPassword} />

          {!isLogin && role === 'Student' && (
            <>
              <TextInput style={styles.input} placeholder="Student ID" placeholderTextColor="#666" value={studentID} onChangeText={setStudentID} />
              <TextInput style={styles.input} placeholder="Class / Year" placeholderTextColor="#666" value={currentClass} onChangeText={setCurrentClass} />
              <TextInput style={styles.input} placeholder="Degree Program" placeholderTextColor="#666" value={degreeName} onChangeText={setDegreeName} />
            </>
          )}

          {!isLogin && (role !== 'Student') && (
            <>
              <TextInput style={styles.input} placeholder="Staff ID" placeholderTextColor="#666" value={staffID} onChangeText={setStaffID} />
              <TextInput style={styles.input} placeholder="Faculty" placeholderTextColor="#666" value={faculty} onChangeText={setFaculty} />
            </>
          )}

          <TouchableOpacity style={styles.actionButton} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? 'Authorize Access' : 'Create Account'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.linkText}>
              {isLogin ? "New Member? " : "Already have an account? "}
              <Text style={{fontWeight: 'bold'}}>{isLogin ? "Create Account" : "Login"}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="LecturerForm" component={LecturerForm} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="PRLDashboard" component={PRLDashboard} />
        <Stack.Screen name="PLDashboard" component={PLDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, justifyContent: 'center', padding: 30, backgroundColor: '#121212' },
  brandContainer: { alignItems: 'center', marginBottom: 30, marginTop: 40 },
  logoText: { fontSize: 40, color: '#4340f5', fontWeight: '900', letterSpacing: 2 },
  header: { fontSize: 18, color: '#FFFFFF', opacity: 0.8, marginTop: 5 },
  inputContainer: { width: '100%' },
  label: { color: '#B0B0B0', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#1E1E1E', color: '#FFFFFF', marginBottom: 20, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  roleBtn: { width: '48%', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginBottom: 10, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#4340f5', borderColor: '#4340f5' },
  roleBtnText: { color: '#B0B0B0', fontWeight: 'bold' },
  roleBtnTextActive: { color: '#fff' },
  actionButton: { backgroundColor: '#4340f5', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 10, marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#B0B0B0', marginTop: 30, textAlign: 'center', fontSize: 14 }
});
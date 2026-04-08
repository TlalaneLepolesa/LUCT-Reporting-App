import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity } from 'react-native';

// Firebase Imports
import { auth, db } from './firebaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Screen Imports
import RegistrationScreen from './RegistrationScreen';
import LecturerForm from './LecturerForm';
import StudentDashboard from './StudentDashboard';
import PRLDashboard from './PRLDashboard';
import PLDashboard from './PLDashboard';

const Stack = createStackNavigator();

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    console.log("Attempting Login...");
    if (!email || !password) {
      window.alert("Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase Auth Success!");

      // Fetch the role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        console.log("Role identified:", role);

        // Names here MUST match the Stack.Screen 'name' prop below
        if (role === 'Lecturer') navigation.navigate('LecturerForm');
        else if (role === 'Student') navigation.navigate('StudentDashboard');
        else if (role === 'PRL') navigation.navigate('PRLDashboard');
        else if (role === 'PL') navigation.navigate('PLDashboard');
        else {
          window.alert("Role not recognized. Sending to Lecturer Portal.");
          navigation.navigate('LecturerForm');
        }
      } else {
        console.log("No Firestore doc. Using fallback navigation.");
        navigation.navigate('LecturerForm');
      }
    } catch (error) {
      console.log("Login Error:", error.message);
      window.alert("Login Failed: " + error.message);
    }
  };

  return (
    <View style={styles.center}>
      <Text style={styles.header}>LUCT Reporting System</Text>
      <TextInput 
        placeholder="Email" 
        style={styles.input} 
        onChangeText={setEmail} 
        autoCapitalize="none"
      />
      <TextInput 
        placeholder="Password" 
        style={styles.input} 
        secureTextEntry 
        onChangeText={setPassword} 
      />
      <Button title="Login" onPress={handleLogin} color="#FF69B4" />
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Register here</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{ 
          headerStyle: { backgroundColor: '#FF69B4' }, 
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegistrationScreen} />
        <Stack.Screen name="LecturerForm" component={LecturerForm} options={{ title: 'Lecturer Portal' }} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} options={{ title: 'Student Portal' }} />
        <Stack.Screen name="PRLDashboard" component={PRLDashboard} options={{ title: 'PRL Portal' }} />
        <Stack.Screen name="PLDashboard" component={PLDashboard} options={{ title: 'PL Portal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  header: { fontSize: 26, color: '#FF69B4', textAlign: 'center', marginBottom: 30, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', marginBottom: 15, padding: 15, borderRadius: 8 },
  linkText: { color: '#FF69B4', marginTop: 20, textAlign: 'center' }
});
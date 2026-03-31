import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import LecturerForm from './LecturerForm';
import { doc, getDoc } from "firebase/firestore";
import StudentDashboard from './StudentDashboard';
import PLDashboard from './PLDashboard';
import RegistrationScreen from './RegistrationScreen';

const Stack = createStackNavigator();

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch the role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Route based on role
        if (userData.role === 'Lecturer') {
          navigation.navigate('LecturerDashboard');
        } else if (userData.role === 'PRL') {
          navigation.navigate('PRLDashboard');
        } else {
          alert("Role dashboard under construction, but login successful!");
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };
  return (
    <View style={styles.center}>
      <Text style={styles.header}>LUCT Reporting System</Text>
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry onChangeText={setPassword} />
      <Button title="Login" onPress={handleLogin} color="#FF69B4" />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#FF69B4' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LecturerDashboard" component={LecturerForm} options={{ title: 'Lecturer Portal' }} />
        <Stack.Screen name="Register" component={RegistrationScreen} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="PLDashboard" component={PLDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  header: { fontSize: 24, color: '#FF69B4', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#fff', marginBottom: 15, padding: 15, borderRadius: 8 }
});
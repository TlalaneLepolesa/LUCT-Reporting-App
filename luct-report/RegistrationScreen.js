import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegistrationScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Lecturer'); 

  const handleRegister = async () => {
    console.log("Registering user...");
    if (!email || !password) {
      window.alert("Please fill in all fields.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        role: role 
      });

      console.log("User Profile Created in Firestore");
      window.alert("Success: Account created! You can now login.");
      navigation.navigate('Login');
    } catch (error) {
      console.log("Registration Error:", error.message);
      window.alert("Registration Error: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Account</Text>
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry onChangeText={setPassword} />
      
      <Text style={styles.label}>Enter Role (Student, Lecturer, PRL, or PL):</Text>
      <TextInput 
        placeholder="Type Role Exactly" 
        style={styles.input} 
        onChangeText={setRole} 
        value={role} 
      />

      <Button title="Register" onPress={handleRegister} color="#007AFF" />
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 25, 
    backgroundColor: '#121212' // Deep professional dark
  },
  header: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#FFFFFF', // Clean White
    textAlign: 'center', 
    marginBottom: 30,
    letterSpacing: 1
  },
  label: { 
    color: '#B0B0B0', // Muted Grey for labels
    marginBottom: 8, 
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  input: { 
    backgroundColor: '#1E1E1E', // Slightly lighter than background
    color: '#FFFFFF',
    marginBottom: 20, 
    padding: 15, 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#333333' // Subtle border
  },
  pickerContainer: { 
    backgroundColor: '#1E1E1E', 
    borderRadius: 5, 
    marginBottom: 20, 
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden'
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 5,
    overflow: 'hidden'
  },
  linkText: { 
    color: '#007AFF', // Standard Professional Blue
    marginTop: 25, 
    textAlign: 'center',
    fontWeight: '500'
  }
});
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

      <Button title="Register" onPress={handleRegister} color="#FF69B4" />
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  header: { fontSize: 24, color: '#FF69B4', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#fff', marginBottom: 15, padding: 15, borderRadius: 8 },
  label: { color: '#fff', marginBottom: 5 },
  linkText: { color: '#FF69B4', marginTop: 20, textAlign: 'center' }
});
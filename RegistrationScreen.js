import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegistrationScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student'); // Default role

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save the user's role in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        role: role // Student, Lecturer, PRL, or PL
      });

      Alert.alert("Success", "Account created! You can now login.");
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert("Registration Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Account</Text>
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry onChangeText={setPassword} />
      
      <Text style={styles.label}>Select Role (Student, Lecturer, PRL, PL):</Text>
      <TextInput 
        placeholder="Type Role Exactly" 
        style={styles.input} 
        onChangeText={setRole} 
        value={role} 
      />

      <Button title="Register" onPress={handleRegister} color="#FF69B4" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  header: { fontSize: 24, color: '#FF69B4', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#fff', marginBottom: 15, padding: 15, borderRadius: 8 },
  label: { color: '#fff', marginBottom: 5 }
});
// File: components/SignUpDetailsForm.tsx

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeSpaceLogo from './SafeSpaceLogo';

type TherapyType = 'adult' | 'minor' | 'guardian' | null;

type SignUpDetailsFormProps = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  error?: string;
  loading?: boolean;
  therapyType: TherapyType;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onSignUp: () => void;
  onBack: () => void;
  onNavigateToSignIn: () => void;
};

const SignUpDetailsForm: React.FC<SignUpDetailsFormProps> = ({
  firstName,
  lastName,
  email,
  password,
  error,
  loading = false,
  therapyType,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPasswordChange,
  onSignUp,
  onBack,
  onNavigateToSignIn
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const getTherapyTypeTitle = () => {
    switch (therapyType) {
      case 'adult': return 'Adult Registration';
      case 'minor': return 'Minor Registration';
      case 'guardian': return 'Guardian Registration';
      default: return 'Registration';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#7FDBDA" />
        </TouchableOpacity>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <SafeSpaceLogo size={60} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{getTherapyTypeTitle()}</Text>

      {/* Form */}
      <View style={styles.formContainer}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        {/* First Name */}
        <Text style={styles.inputLabel}>First Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={onFirstNameChange}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

        {/* Last Name */}
        <Text style={styles.inputLabel}>Last Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={onLastNameChange}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

        {/* Email */}
        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            value={email}
            onChangeText={onEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        {/* Password */}
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password (min 6 characters)"
            value={password}
            onChangeText={onPasswordChange}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#999" 
            />
          </TouchableOpacity>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={[styles.signUpButton, loading && styles.disabledButton]}
          onPress={onSignUp}
          disabled={loading}
        >
          <Text style={styles.signUpButtonText}>
            {loading ? "Creating Account..." : "Create Account"}
          </Text>
        </TouchableOpacity>

        {/* Bottom Link */}
        <TouchableOpacity 
          style={styles.bottomLinkContainer}
          onPress={onNavigateToSignIn}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  signUpButton: {
    backgroundColor: '#7FDBDA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomLinkContainer: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  linkTextBold: {
    fontWeight: '600',
    color: '#7FDBDA',
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: '#FFE8E8',
    padding: 12,
    borderRadius: 8,
  },
});

export default SignUpDetailsForm;
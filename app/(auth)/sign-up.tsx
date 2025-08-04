// File: app/(auth)/sign-up.tsx

import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  Text, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import SignUpDetailsForm from '../../components/SignUpDetailsForm';
import SafeSpaceLogo from '../../components/SafeSpaceLogo';

type TherapyType = 'adult' | 'minor' | 'guardian' | null;

export default function SignUpScreen(): React.JSX.Element {
  const [selectedTherapyType, setSelectedTherapyType] = useState<TherapyType>(null);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();

  const handleTherapyTypeSelect = (type: TherapyType) => {
    setSelectedTherapyType(type);
    setShowDetailsForm(true);
  };

  const handleSignUp = async (): Promise<void> => {
    if (!firstName || !lastName || !email || !password) {
        setError("Please fill out all fields.");
        return;
    }
    setLoading(true);
    setError('');

    try {
      const result = await signUp(email, password, firstName, lastName);

      if (result?.error) {
        setError(result.error);
      } else {
        Alert.alert(
            "Sign Up Successful", 
            "Please check your email to verify your account before logging in."
        );
        router.replace('/(auth)/login');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowDetailsForm(false);
    setSelectedTherapyType(null);
  };

  if (showDetailsForm) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <SignUpDetailsForm
            firstName={firstName}
            lastName={lastName}
            email={email}
            password={password}
            error={error}
            loading={loading}
            therapyType={selectedTherapyType}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSignUp={handleSignUp}
            onBack={handleBack}
            onNavigateToSignIn={() => router.push('/(auth)/login')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <SafeSpaceLogo size={80} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Sign Up To SafeSpace</Text>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.tabText}>Sign In</Text>
          </TouchableOpacity>
          <View style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Sign Up</Text>
          </View>
        </View>

        {/* Therapy Type Selection */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            What type of therapy are you looking for?
          </Text>
          
          <View style={styles.optionsContainer}>
            {/* For Adult */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleTherapyTypeSelect('adult')}
            >
              <View style={styles.optionContent}>
                <View style={styles.illustrationContainer}>
                  <View style={[styles.illustration, styles.adultIllustration]}>
                    <Text style={styles.illustrationEmoji}>👨‍💼</Text>
                  </View>
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>For Adult</Text>
                  <Text style={styles.optionSubtitle}>18 years or older</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* For Minor */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleTherapyTypeSelect('minor')}
            >
              <View style={styles.optionContent}>
                <View style={styles.illustrationContainer}>
                  <View style={[styles.illustration, styles.minorIllustration]}>
                    <Text style={styles.illustrationEmoji}>👶</Text>
                  </View>
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>For Minor</Text>
                  <Text style={styles.optionSubtitle}>Under 18 years old</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* For Guardian */}
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => handleTherapyTypeSelect('guardian')}
            >
              <View style={styles.optionContent}>
                <View style={styles.illustrationContainer}>
                  <View style={[styles.illustration, styles.guardianIllustration]}>
                    <Text style={styles.illustrationEmoji}>👩‍👧‍👦</Text>
                  </View>
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>For Guardian</Text>
                  <Text style={styles.optionSubtitle}>Managing minor account</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Link */}
          <TouchableOpacity 
            style={styles.bottomLinkContainer}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.linkText}>
              Already signed up? <Text style={styles.linkTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    padding: 4,
    marginBottom: 40,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeTab: {
    backgroundColor: '#7FDBDA',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  questionContainer: {
    width: '100%',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  illustrationContainer: {
    marginRight: 16,
  },
  illustration: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adultIllustration: {
    backgroundColor: '#E3F2FD',
  },
  minorIllustration: {
    backgroundColor: '#F3E5F5',
  },
  guardianIllustration: {
    backgroundColor: '#FFF3E0',
  },
  illustrationEmoji: {
    fontSize: 28,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
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
});
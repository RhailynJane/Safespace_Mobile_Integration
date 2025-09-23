// app/(auth)/success.tsx
import SuccessStep from '../../components/SuccessStep';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';

export default function SuccessScreen() {
  const router = useRouter();
  const { signIn } = useSignIn();

  const handleSignIn = async () => {
    try {
      // Navigate to login page where user can sign in
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error navigating to login:', error);
    }
  };

  return <SuccessStep onSignIn={handleSignIn} onContinue={function (): void {
      throw new Error('Function not implemented.');
  } } />;
}
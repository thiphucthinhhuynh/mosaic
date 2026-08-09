import { Link } from 'react-router';
import { SignupForm } from '@/features/auth';

export function SignupPage() {
  return (
    <>
      <h1>Sign up</h1>
      <SignupForm />
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </>
  );
}

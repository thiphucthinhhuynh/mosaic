import { Link } from 'react-router';
import { LoginForm } from '@/features/auth';

export function LoginPage() {
  return (
    <>
      <h1>Log in</h1>
      <LoginForm />
      <p>
        Don&apos;t have an account? <Link to="/signup">Sign up</Link>
      </p>
    </>
  );
}

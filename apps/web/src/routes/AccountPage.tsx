import { useAuth } from '@/features/auth';

export function AccountPage() {
  // Safe to assume non-null: this page is only ever rendered inside
  // <ProtectedRoute>, which redirects to /login before this component mounts.
  const { user } = useAuth();

  return (
    <>
      <h1>Account</h1>
      <p>Logged in as {user!.username}</p>
      <p>User ID: {user!.id}</p>
    </>
  );
}

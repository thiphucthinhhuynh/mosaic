import { Link } from 'react-router';
import { useAuth } from '@/features/auth';

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      <Link to="/">Mosaic</Link>
      {user ? (
        <>
          <Link to="/account">{user.username}</Link>
          <button type="button" onClick={() => void logout()}>
            Log out
          </button>
        </>
      ) : (
        <>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </>
      )}
    </nav>
  );
}

import { Link } from 'react-router';
import { CreateStoreForm } from '@/features/stores';

export function CreateStorePage() {
  return (
    <>
      <h1>Create a store</h1>
      <CreateStoreForm />
      <p>
        <Link to="/stores">Back to stores</Link>
      </p>
    </>
  );
}

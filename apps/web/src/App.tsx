import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, ProtectedRoute } from '@/features/auth';
import { NavBar } from '@/components/NavBar';
import { HomePage } from '@/routes/HomePage';
import { LoginPage } from '@/routes/LoginPage';
import { SignupPage } from '@/routes/SignupPage';
import { AccountPage } from '@/routes/AccountPage';
import { StoresPage } from '@/routes/StoresPage';
import { StoreDetailPage } from '@/routes/StoreDetailPage';
import { CreateStorePage } from '@/routes/CreateStorePage';
import { EditStorePage } from '@/routes/EditStorePage';
import { ItemDetailPage } from '@/routes/ItemDetailPage';
import { CreateItemPage } from '@/routes/CreateItemPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <NavBar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/stores" element={<StoresPage />} />
              <Route
                path="/stores/new"
                element={
                  <ProtectedRoute>
                    <CreateStorePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/stores/:id" element={<StoreDetailPage />} />
              <Route
                path="/stores/:id/items/new"
                element={
                  <ProtectedRoute>
                    <CreateItemPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditStorePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/items/:id" element={<ItemDetailPage />} />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

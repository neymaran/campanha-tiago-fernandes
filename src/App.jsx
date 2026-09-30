import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { ToastProvider } from './components/ui/Toast';

// Application Pages
import LoginPage from './pages/Login/LoginPage';
import DoacoesPage from './pages/Doacoes/DoacoesPage';
import DespesasPage from './pages/Despesas/DespesasPage';
import ContasPage from './pages/Contas/ContasPage';
import UsuariosPage from './pages/Usuarios/UsuariosPage';

/**
 * Root Application Component
 * Configures React Router v6 routing, layout wrapping, and global toast notifications.
 */
function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route (without Navbar / Layout) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Routes with Top Navigation Layout */}
          <Route
            path="/doacoes"
            element={
              <Layout>
                <DoacoesPage />
              </Layout>
            }
          />
          <Route
            path="/despesas"
            element={
              <Layout>
                <DespesasPage />
              </Layout>
            }
          />
          <Route
            path="/contas"
            element={
              <Layout>
                <ContasPage />
              </Layout>
            }
          />
          <Route
            path="/usuarios"
            element={
              <Layout>
                <UsuariosPage />
              </Layout>
            }
          />

          {/* Fallback Redirects */}
          <Route path="/" element={<Navigate to="/doacoes" replace />} />
          <Route path="*" element={<Navigate to="/doacoes" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

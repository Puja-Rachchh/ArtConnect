import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext.jsx';
import Landing from './pages/Landing.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import ArtistDashboard from './pages/ArtistDashboard.jsx';
import BuyerMarketplace from './pages/BuyerMarketplace.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/artist/dashboard" 
              element={
                <ProtectedRoute requiredRole="artist">
                  <ArtistDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/buyer/marketplace" 
              element={
                <ProtectedRoute requiredRole="buyer">
                  <BuyerMarketplace />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </RoleProvider>
    </BrowserRouter>
  );
}

export default App;

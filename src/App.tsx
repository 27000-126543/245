import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import CaseFiling from "@/pages/CaseFiling";
import CaseAssign from "@/pages/CaseAssign";
import Service from "@/pages/Service";
import Scheduling from "@/pages/Scheduling";
import Trial from "@/pages/Trial";
import Document from "@/pages/Document";
import Execution from "@/pages/Execution";
import System from "@/pages/System";
import { useStore } from "@/store/useStore";

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { currentUser } = useStore();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="case-filing" element={
            <ProtectedRoute roles={['clerk', 'judge', 'chief', 'president', 'admin']}>
              <CaseFiling />
            </ProtectedRoute>
          } />
          <Route path="case-assign" element={
            <ProtectedRoute roles={['chief', 'president', 'admin']}>
              <CaseAssign />
            </ProtectedRoute>
          } />
          <Route path="service" element={
            <ProtectedRoute roles={['clerk', 'judge', 'chief', 'president', 'admin']}>
              <Service />
            </ProtectedRoute>
          } />
          <Route path="scheduling" element={
            <ProtectedRoute roles={['clerk', 'judge', 'chief', 'president', 'admin']}>
              <Scheduling />
            </ProtectedRoute>
          } />
          <Route path="trial" element={
            <ProtectedRoute roles={['judge', 'chief', 'president', 'admin']}>
              <Trial />
            </ProtectedRoute>
          } />
          <Route path="document" element={
            <ProtectedRoute roles={['judge', 'chief', 'president', 'admin']}>
              <Document />
            </ProtectedRoute>
          } />
          <Route path="execution" element={
            <ProtectedRoute roles={['judge', 'chief', 'president', 'admin']}>
              <Execution />
            </ProtectedRoute>
          } />
          <Route path="system" element={
            <ProtectedRoute roles={['admin', 'president']}>
              <System />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

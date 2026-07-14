import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

import Login from './pages/auth/Login'
import RegisterMadrasah from './pages/auth/RegisterMadrasah'
import ForgotPassword from './pages/auth/ForgotPassword'
import Unauthorized from './pages/common/Unauthorized'
import NotFound from './pages/common/NotFound'
import Help from './pages/common/Help'

import DashboardSuperAdmin from './pages/dashboard/DashboardSuperAdmin'
import DashboardAdminMadrasah from './pages/dashboard/DashboardAdminMadrasah'
import DashboardGuru from './pages/dashboard/DashboardGuru'
import DashboardSiswa from './pages/dashboard/DashboardSiswa'
import DashboardOrangTua from './pages/dashboard/DashboardOrangTua'

import MadrasahList from './pages/admin/MadrasahList'
import TeacherList from './pages/admin/TeacherList'
import StudentList from './pages/admin/StudentList'
import ClassList from './pages/admin/ClassList'
import ActivationCodeList from './pages/admin/ActivationCodeList'
import ActivityLogPage from './pages/admin/ActivityLogPage'
import AssessmentPeriodList from './pages/admin/AssessmentPeriodList'
import InstrumentBank from './pages/admin/InstrumentBank'
import QuestionBank from './pages/admin/QuestionBank'
import BackupRestore from './pages/admin/BackupRestore'

import TakeAssessment from './pages/siswa/TakeAssessment'
import TakeCognitiveAssessment from './pages/siswa/TakeCognitiveAssessment'
import AssessmentResult from './pages/siswa/AssessmentResult'
import TeacherObservationList from './pages/admin/TeacherObservationList'
import FollowUpList from './pages/admin/FollowUpList'
import ClassMapping from './pages/admin/ClassMapping'

const ALL_ROLES = ['super_admin', 'admin_madrasah', 'guru', 'guru_bk', 'siswa', 'orang_tua']

function DashboardRouter() {
  return (
    <ProtectedRoute allowedRoles={ALL_ROLES}>
      <RoleDashboard />
    </ProtectedRoute>
  )
}

import { useAuth } from './context/AuthContext'

function RoleDashboard() {
  const { role } = useAuth()
  switch (role) {
    case 'super_admin':
      return <DashboardSuperAdmin />
    case 'admin_madrasah':
      return <DashboardAdminMadrasah />
    case 'guru':
    case 'guru_bk':
      return <DashboardGuru />
    case 'siswa':
      return <DashboardSiswa />
    case 'orang_tua':
      return <DashboardOrangTua />
    default:
      return <Navigate to="/unauthorized" replace />
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registrasi-madrasah" element={<RegisterMadrasah />} />
          <Route path="/lupa-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<RoleDashboard />} />
            <Route path="/bantuan" element={<Help />} />

            <Route
              path="/madrasah"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <MadrasahList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guru"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin_madrasah']}>
                  <TeacherList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/siswa"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin_madrasah', 'guru', 'guru_bk']}>
                  <StudentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kelas"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin_madrasah']}>
                  <ClassList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kode-aktivasi"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <ActivationCodeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/log-aktivitas"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin_madrasah']}>
                  <ActivityLogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/periode-asesmen"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin_madrasah']}>
                  <AssessmentPeriodList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bank-instrumen"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin_madrasah', 'guru_bk']}>
                  <InstrumentBank />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bank-soal"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin_madrasah', 'guru_bk']}>
                  <QuestionBank />
                </ProtectedRoute>
              }
            />
            <Route
              path="/backup-restore"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin_madrasah']}>
                  <BackupRestore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/asesmen/kerjakan/:assignmentId"
              element={
                <ProtectedRoute allowedRoles={['siswa']}>
                  <TakeAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/asesmen/kerjakan-kognitif/:assignmentId"
              element={
                <ProtectedRoute allowedRoles={['siswa']}>
                  <TakeCognitiveAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/observasi-guru"
              element={
                <ProtectedRoute allowedRoles={['admin_madrasah', 'guru', 'guru_bk']}>
                  <TeacherObservationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tindak-lanjut"
              element={
                <ProtectedRoute allowedRoles={['admin_madrasah', 'guru', 'guru_bk']}>
                  <FollowUpList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pemetaan-kelas"
              element={
                <ProtectedRoute allowedRoles={['admin_madrasah', 'guru', 'guru_bk']}>
                  <ClassMapping />
                </ProtectedRoute>
              }
            />
            <Route
              path="/asesmen/hasil/:studentId?"
              element={
                <ProtectedRoute allowedRoles={ALL_ROLES}>
                  <AssessmentResult />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}

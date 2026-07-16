import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { getStoredLicense } from './lib/codes'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ActivationPage from './components/ActivationPage'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import RegisterMadrasah from './pages/auth/RegisterMadrasah'
import DashboardSuperAdmin from './pages/dashboard/DashboardSuperAdmin'
import DashboardAdminMadrasah from './pages/dashboard/DashboardAdminMadrasah'
import DashboardSiswa from './pages/dashboard/DashboardSiswa'
import MadrasahList from './pages/admin/MadrasahList'
import TeacherList from './pages/admin/TeacherList'
import StudentList from './pages/admin/StudentList'
import ClassList from './pages/admin/ClassList'
import ClassMapping from './pages/admin/ClassMapping'
import AssessmentPeriodList from './pages/admin/AssessmentPeriodList'
import InstrumentBank from './pages/admin/InstrumentBank'
import QuestionBank from './pages/admin/QuestionBank'
import ActivationCodeList from './pages/admin/ActivationCodeList'
import ActivityLogPage from './pages/admin/ActivityLogPage'
import BackupRestore from './pages/admin/BackupRestore'
import TeacherObservationList from './pages/admin/TeacherObservationList'
import FollowUpList from './pages/admin/FollowUpList'
import TakeAssessment from './pages/siswa/TakeAssessment'
import TakeCognitiveAssessment from './pages/siswa/TakeCognitiveAssessment'
import AssessmentResult from './pages/siswa/AssessmentResult'

function DashboardRouter() {
  const { role } = useAuth()
  switch (role) {
    case 'admin': return <DashboardSuperAdmin />
    case 'madrasah': return <DashboardAdminMadrasah />
    case 'siswa': return <DashboardSiswa />
    // Legacy roles redirect to madrasah dashboard
    case 'admin_madrasah': return <DashboardAdminMadrasah />
    case 'guru':
    case 'guru_bk': return <DashboardAdminMadrasah />
    default: return <Navigate to="/login" replace />
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/aktivasi" element={<ActivationPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register-madrasah" element={<RegisterMadrasah />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/madrasah" element={<MadrasahList />} />
        <Route path="/guru" element={<TeacherList />} />
        <Route path="/siswa" element={<StudentList />} />
        <Route path="/kelas" element={<ClassList />} />
        <Route path="/pemetaan-kelas" element={<ClassMapping />} />
        <Route path="/periode-asesmen" element={<AssessmentPeriodList />} />
        <Route path="/bank-instrumen" element={<InstrumentBank />} />
        <Route path="/bank-soal" element={<QuestionBank />} />
        <Route path="/observasi-guru" element={<TeacherObservationList />} />
        <Route path="/tindak-lanjut" element={<FollowUpList />} />
        <Route path="/kode-aktivasi" element={<ActivationCodeList />} />
        <Route path="/log-aktivitas" element={<ActivityLogPage />} />
        <Route path="/backup-restore" element={<BackupRestore />} />
        <Route path="/asesmen/:assignmentId" element={<TakeAssessment />} />
        <Route path="/asesmen/kognitif/:assignmentId" element={<TakeCognitiveAssessment />} />
        <Route path="/asesmen/hasil" element={<AssessmentResult />} />
        <Route path="/asesmen/hasil/:studentId" element={<AssessmentResult />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}

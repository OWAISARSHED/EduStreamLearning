import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/guards/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import MultilingualPrompt from './pages/MultilingualPrompt';
import DiscussionForum from './pages/DiscussionForum';
import AIDocumentInsights from './pages/AIDocumentInsights';
import MentorWorkspace from './pages/MentorWorkspace';
import DocumentRepository from './pages/DocumentRepository';
import AdminPanel from './pages/AdminPanel';
import AdminCourseApprovals from './pages/AdminCourseApprovals';
import AdminAIAnalytics from './pages/AdminAIAnalytics';
import AdminOnlineTime from './pages/AdminOnlineTime';
import UserProfile from './pages/UserProfile';
import NotificationCenter from './pages/NotificationCenter';
import AIChat from './pages/AIChat';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ResourceAccessLog from './pages/ResourceAccessLog';
import CourseViewer from './pages/CourseViewer';


function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const redirectMap = { student: '/dashboard', mentor: '/mentor', admin: '/admin' };
  return <Navigate to={redirectMap[user.role] || '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/ai-prompt" element={<ProtectedRoute roles={['student']}><MultilingualPrompt /></ProtectedRoute>} />
        <Route path="/forum" element={<ProtectedRoute roles={['student','mentor','admin']}><DiscussionForum /></ProtectedRoute>} />
        <Route path="/ai-insights" element={<ProtectedRoute roles={['student','mentor','admin']}><AIDocumentInsights /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute roles={['student','mentor','admin']}><DocumentRepository /></ProtectedRoute>} />
        <Route path="/mentor" element={<ProtectedRoute roles={['mentor']}><MentorWorkspace /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><AdminCourseApprovals /></ProtectedRoute>} />
        <Route path="/admin/ai-analytics" element={<ProtectedRoute roles={['admin']}><AdminAIAnalytics /></ProtectedRoute>} />
        <Route path="/admin/online-time" element={<ProtectedRoute roles={['admin']}><AdminOnlineTime /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute roles={['student','mentor','admin']}><UserProfile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute roles={['student','mentor','admin']}><NotificationCenter /></ProtectedRoute>} />
        <Route path="/ai-chat" element={<ProtectedRoute roles={['student','mentor','admin']}><AIChat /></ProtectedRoute>} />
        <Route path="/resource-access" element={<ProtectedRoute roles={['mentor','admin']}><ResourceAccessLog /></ProtectedRoute>} />
        <Route path="/course/:courseId" element={<ProtectedRoute roles={['student']}><CourseViewer /></ProtectedRoute>} />

      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

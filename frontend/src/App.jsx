import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import FooterSection from './components/Footer'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
// Admin
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
// Student
import StudentDashboard from './pages/students/Dashboard'
import MyGroupPage from './pages/students/MyGroup'
import SupervisorsList from './pages/students/SupervisorsList'
import Chatbot from './pages/students/Chabot'
import TeamChat from './pages/students/TeamChat'
import AssignedTasks from './pages/students/AssignedTasks'
import MyGrades from './pages/students/MyGrades'
import StudentMilestones from './pages/students/StudentMilestones'
import StudentThesis from './pages/students/StudentThesis'
// Supervisor
import SupervisorDashboard from './pages/supervisor/Dashboard'
import Supervisionrequests from './pages/supervisor/SupervisionRequests'
import MyGroups from './pages/supervisor/MyGroups'
import TaskManagement from './pages/supervisor/ManageTasks'
import SupervisorGrading from './pages/supervisor/Grading'
import SupervisorTeamChat from './pages/supervisor/TeamChat'
// Coordinator
import CoordinatorDashboard from './pages/coordinator/Dashboard'
import CoordinatorMilestones from './pages/coordinator/Milestones'
import CoordinatorGrading from './pages/coordinator/Grading'
import CoordinatorDocumentManagement from './pages/coordinator/DocumentManagement'
// Common
import ProfilePage from './components/Profile'
import RestrictedRoutes from './components/RestrictedRoutes'
import UnauthorizedPage from './components/Unauthorized'


// Router definition
const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/about-us", element: <><Navbar /><AboutUs /><FooterSection /></> },
  { path: "/contact-us", element: <><Navbar /><ContactUs /><FooterSection /></> },

  // Admin Routes
  {
    path: "/admin",
    element: <RestrictedRoutes rolesAllowed={['admin']}><Navbar /><Outlet /><FooterSection /></RestrictedRoutes>,
    children: [
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "users", element: <UserManagement /> },
      { path: "profile", element: <ProfilePage /> }
    ]
  },

  // Student Routes
  {
    path: "/student",
    element: <RestrictedRoutes rolesAllowed={['student']}><Navbar /><Outlet /><FooterSection /></RestrictedRoutes>,
    children: [
      { path: "dashboard", element: <StudentDashboard /> },
      { path: "dashboard/supervisors", element: <SupervisorsList /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "fyp-group", element: <MyGroupPage /> },
      { path: "chatbot", element: <Chatbot /> },
      { path: "assigned-tasks", element: <AssignedTasks /> },
      { path: "milestones", element: <StudentMilestones /> },
      { path: "my-grades", element: <MyGrades /> },
      { path: "team-chat", element: <TeamChat /> },
      { path: "thesis", element: <StudentThesis /> }
    ]
  },

  // Supervisor Routes
  {
    path: "/supervisor",
    element: <RestrictedRoutes rolesAllowed={['supervisor']}><Navbar /><Outlet /><FooterSection /></RestrictedRoutes>,
    children: [
      { path: "dashboard", element: <SupervisorDashboard /> },
      { path: "dashboard/supervision-requests", element: <Supervisionrequests /> },
      { path: "my-groups", element: <MyGroups /> },
      { path: "manage-tasks", element: <TaskManagement /> },
      { path: "grading", element: <SupervisorGrading /> },
      { path: "team-chat", element: <SupervisorTeamChat /> },
      { path: "profile", element: <ProfilePage /> }
    ]
  },

  // Coordinator Routes
  {
    path: "/coordinator",
    element: <RestrictedRoutes rolesAllowed={['coordinator']}><Navbar /><Outlet /><FooterSection /></RestrictedRoutes>,
    children: [
      { path: "dashboard", element: <CoordinatorDashboard /> },
      { path: "milestones", element: <CoordinatorMilestones /> },
      { path: "grading", element: <CoordinatorGrading /> },
      { path: "documents", element: <CoordinatorDocumentManagement /> },
      { path: "profile", element: <ProfilePage /> }
    ]
  },

  { path: "/unauthorized", element: <UnauthorizedPage /> }
])

const App = () => <RouterProvider router={router} />

export default App

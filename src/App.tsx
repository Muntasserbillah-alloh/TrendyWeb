import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { RequireAuth } from './components/auth/RequireAuth'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute'
import { RequireRole } from './components/auth/RequireRole'
import { DashboardPage } from './pages/Dashboard/DashboardPage.tsx'
import { TrendsPage } from './pages/Trends/TrendsPage'
import { SavedTrendsPage } from './pages/Trends/SavedTrendsPage'
import { ResearchPage } from './pages/Research/ResearchPage'
import { SearchTab } from './pages/Research/SearchTab'
import { TrendingVideosTab } from './pages/Research/TrendingVideosTab'
import { OutliersTab } from './pages/Research/OutliersTab'
import { TopicAnalysisTab } from './pages/Research/TopicAnalysisTab'
import { VideoIdeasTab } from './pages/Research/VideoIdeasTab'
import { TrendingTab } from './pages/Research/TrendingTab'
import { HashtagsTab } from './pages/Research/HashtagsTab'
import { ChannelTab } from './pages/Research/ChannelTab'
import { CollectionsPage } from './pages/Research/CollectionsPage'
import { CollectionDetailPage } from './pages/Research/CollectionDetailPage'
import { RegionsPage } from './pages/Regions/RegionsPage'
import { CategoriesPage } from './pages/Categories/CategoriesPage'
import { PlannerPage } from './pages/Planner/PlannerPage'
import { CreatorPage } from './pages/Creator/CreatorPage'
import { VelocityPage } from './pages/Velocity/VelocityPage'
import { LoginPage } from './pages/Auth/LoginPage'
import { NewUserPage } from './pages/Admin/NewUserPage'
import { UsersPage } from './pages/Admin/UsersPage'
import { ProfilePage } from './pages/Profile/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="trends">
          <Route index element={<Navigate to="explore" replace />} />
          <Route path="explore" element={<TrendsPage />} />
          <Route path="saved" element={<SavedTrendsPage />} />
        </Route>
        <Route path="planner" element={<PlannerPage />} />
        <Route path="creator" element={<CreatorPage />} />
        <Route path="velocity" element={<VelocityPage />} />
        <Route path="youtube" element={<ResearchPage />}>
          <Route index element={<Navigate to="search" replace />} />
          <Route path="search" element={<SearchTab />} />
          <Route path="trending-videos" element={<TrendingVideosTab />} />
          <Route path="outliers" element={<OutliersTab />} />
          <Route path="analysis" element={<TopicAnalysisTab />} />
          <Route path="ideas" element={<VideoIdeasTab />} />
          <Route path="trending" element={<TrendingTab />} />
          <Route path="hashtags" element={<HashtagsTab />} />
          <Route path="channel" element={<ChannelTab />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:id" element={<CollectionDetailPage />} />
          <Route path="analytics" element={<Navigate to="analysis" replace />} />
        </Route>
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="admin/users"
          element={
            <RequireRole roles={['admin']}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/users/new"
          element={
            <RequireRole roles={['admin']}>
              <NewUserPage />
            </RequireRole>
          }
        />
        <Route path="admin" element={<Navigate to="/admin/users" replace />} />
        <Route path="research" element={<Navigate to="/youtube/search" replace />} />
        <Route path="regions" element={<RegionsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

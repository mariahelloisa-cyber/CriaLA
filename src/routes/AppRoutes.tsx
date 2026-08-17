import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { RoleRoute } from '@/components/auth/role-route'
import { ROUTES } from '@/constants/routes'
import {
  ClassDetailPage,
  ClassEditPage,
  ClassNewPage,
  ClassesPage,
  CourseDetailPage,
  CourseEditPage,
  CourseNewPage,
  CoursesPage,
  DashboardPage,
  EnrollmentDetailPage,
  EnrollmentEditPage,
  EnrollmentNewPage,
  EnrollmentsPage,
  GoalsPage,
  LoginPage,
  NotFoundPage,
  PreviewPage,
  ReportsPage,
  SaleDetailPage,
  SaleEditPage,
  SaleNewPage,
  SalesPage,
  SellerDetailPage,
  SellersPage,
  StudentDetailPage,
  StudentEditPage,
  StudentNewPage,
  StudentsPage,
  TeacherDetailPage,
  TeacherEditPage,
  TeacherNewPage,
  TeachersPage,
  UnitDetailPage,
  UnitEditPage,
  UnitNewPage,
  UnitsPage,
} from '@/pages'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<Navigate to={ROUTES.login} replace />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route
        path={ROUTES.preview}
        element={
          <ProtectedRoute>
            <PreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.dashboard}
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.students}
        element={
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.studentNew}
        element={
          <ProtectedRoute>
            <StudentNewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.studentEdit(':id')}
        element={
          <ProtectedRoute>
            <StudentEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.studentDetail(':id')}
        element={
          <ProtectedRoute>
            <StudentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.classes}
        element={
          <ProtectedRoute>
            <ClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.classNew}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <ClassNewPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.classEdit(':id')}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <ClassEditPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.classDetail(':id')}
        element={
          <ProtectedRoute>
            <ClassDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.courses}
        element={
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.courseNew}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <CourseNewPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.courseEdit(':id')}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <CourseEditPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.courseDetail(':id')}
        element={
          <ProtectedRoute>
            <CourseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.units}
        element={
          <ProtectedRoute>
            <UnitsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.unitNew}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <UnitNewPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.unitEdit(':id')}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <UnitEditPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.unitDetail(':id')}
        element={
          <ProtectedRoute>
            <UnitDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.enrollments}
        element={
          <ProtectedRoute>
            <EnrollmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.enrollmentNew}
        element={
          <ProtectedRoute>
            <EnrollmentNewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.enrollmentEdit(':id')}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <EnrollmentEditPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.enrollmentDetail(':id')}
        element={
          <ProtectedRoute>
            <EnrollmentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.sales}
        element={
          <ProtectedRoute>
            <SalesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.saleNew}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <SaleNewPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.saleEdit(':id')}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <SaleEditPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.saleDetail(':id')}
        element={
          <ProtectedRoute>
            <SaleDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.goals}
        element={
          <ProtectedRoute>
            <GoalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.reports}
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.sellers}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <SellersPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.sellerDetail(':id')}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <SellerDetailPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.teachers}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <TeachersPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.teacherNew}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <TeacherNewPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.teacherEdit(':id')}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <TeacherEditPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.teacherDetail(':id')}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['manager']}>
              <TeacherDetailPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      {/* Rota coringa (Fase 16): sem ProtectedRoute, qualquer URL não registrada renderizaria
          uma tela em branco (AppRoutes é o único conteúdo sob <BrowserRouter>, sem layout
          persistente — ver src/app/App.tsx). ProtectedRoute aqui garante que um usuário sem
          sessão continue indo para /login normalmente antes de ver a 404. */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <NotFoundPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

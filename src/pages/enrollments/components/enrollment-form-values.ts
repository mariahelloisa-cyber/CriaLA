import type { EnrollmentStatus } from '@/types/enrollments'
import { todayIso } from '@/utils/format-date'

export interface EnrollmentFormValues {
  student_id: string
  course_id: string
  class_id: string
  enrollment_date: string
  expected_graduation_date: string
  status: EnrollmentStatus
}

export const EMPTY_ENROLLMENT_FORM_VALUES: EnrollmentFormValues = {
  student_id: '',
  course_id: '',
  class_id: '',
  enrollment_date: todayIso(),
  expected_graduation_date: '',
  status: 'active',
}

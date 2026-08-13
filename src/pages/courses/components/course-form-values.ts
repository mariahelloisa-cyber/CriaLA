export interface CourseFormValues {
  name: string
  category_id: string
  description: string
  is_active: boolean
}

export const EMPTY_COURSE_FORM_VALUES: CourseFormValues = {
  name: '',
  category_id: '',
  description: '',
  is_active: true,
}

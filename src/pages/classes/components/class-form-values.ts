import type { ClassStatus } from '@/types/classes'

export interface ClassFormValues {
  name: string
  course_id: string
  unit_id: string
  start_date: string
  end_date: string
  status: ClassStatus
  /** String no formulário (input controlado); vazio = sem vagas definidas (capacity: null). */
  capacity: string
}

export const EMPTY_CLASS_FORM_VALUES: ClassFormValues = {
  name: '',
  course_id: '',
  unit_id: '',
  start_date: '',
  end_date: '',
  status: 'open',
  capacity: '',
}

export interface TeacherFormValues {
  full_name: string
  email: string
  phone: string
  subject_area: string
  is_active: boolean
  classIds: string[]
  /** Arquivo selecionado para envio (novo contrato ou substituição). Só é enviado ao Storage no submit. */
  contractFile: File | null
  /** Marca para remover o contrato atual sem enviar um novo (modo edição). */
  removeContract: boolean
}

export const EMPTY_TEACHER_FORM_VALUES: TeacherFormValues = {
  full_name: '',
  email: '',
  phone: '',
  subject_area: '',
  is_active: true,
  classIds: [],
  contractFile: null,
  removeContract: false,
}

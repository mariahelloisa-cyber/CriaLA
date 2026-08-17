export interface StudentFormValues {
  full_name: string
  birth_date: string
  father_name: string
  mother_name: string
  rg: string
  cpf: string
  phone: string
  email: string
  cep: string
  address: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  class_id: string
  enrollment_date: string
  expected_graduation_date: string
  seller_id: string
}

export const EMPTY_STUDENT_FORM_VALUES: StudentFormValues = {
  full_name: '',
  birth_date: '',
  father_name: '',
  mother_name: '',
  rg: '',
  cpf: '',
  phone: '',
  email: '',
  cep: '',
  address: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  class_id: '',
  enrollment_date: '',
  expected_graduation_date: '',
  seller_id: '',
}

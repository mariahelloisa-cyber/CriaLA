import { supabase } from '@/lib/supabase'
import { listAllClasses } from '@/services/students.service'
import type {
  CreateTeacherInput,
  TeacherClassSummary,
  TeacherDetail,
  TeacherFilters,
  TeacherListItem,
  UpdateTeacherInput,
} from '@/types/teachers'
import type { PaginatedResult } from '@/types/classes'

export { listAllClasses }

const TEACHER_CONTRACTS_BUCKET = 'teacher-contracts'
const TEACHER_SELECT = 'id, full_name, email, phone, subject_area, is_active, contract_file_name, contract_file_path'

interface PostgrestLikeError {
  message: string
  code?: string
}

/** Nunca repassamos error.message bruto do Postgres/PostgREST para a UI. */
function mapError(error: PostgrestLikeError, fallback: string): Error {
  if (error.code === '23505') {
    return new Error('Este professor já está vinculado a esta turma.')
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new Error('Você não tem permissão para realizar esta ação.')
  }
  return new Error(fallback)
}

/** Remove caracteres que podem quebrar o path do objeto no Storage. */
function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function listTeachers(filters: TeacherFilters): Promise<PaginatedResult<TeacherListItem>> {
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase.from('teachers').select(TEACHER_SELECT, { count: 'exact' })

  if (filters.status !== 'all') {
    query = query.eq('is_active', filters.status === 'active')
  }
  if (filters.search.trim()) {
    const term = filters.search.trim().replace(/[%,()]/g, '')
    query = query.or(`full_name.ilike.%${term}%,subject_area.ilike.%${term}%,email.ilike.%${term}%`)
  }

  query = query.order('full_name', { ascending: true }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw mapError(error, 'Não foi possível carregar a lista de professores.')
  }

  const teacherIds = (data ?? []).map((row) => row.id)
  const classCounts = await countClassesByTeacherIds(teacherIds)

  const items: TeacherListItem[] = (data ?? []).map((row) => ({
    ...row,
    classCount: classCounts[row.id] ?? 0,
  }))

  const total = count ?? 0

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

export async function getTeacher(id: string): Promise<TeacherDetail | null> {
  const { data, error } = await supabase
    .from('teachers')
    .select(`${TEACHER_SELECT}, created_at, updated_at`)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw mapError(error, 'Não foi possível carregar os dados do professor.')
  }

  return data
}

export async function createTeacher(input: CreateTeacherInput): Promise<{ id: string }> {
  const { data, error } = await supabase.from('teachers').insert(input).select('id').single()

  if (error) {
    throw mapError(error, 'Não foi possível cadastrar o professor. Tente novamente.')
  }

  return { id: data.id }
}

export async function updateTeacher(id: string, input: UpdateTeacherInput): Promise<void> {
  const { error } = await supabase.from('teachers').update(input).eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível salvar as alterações do professor.')
  }
}

export async function deleteTeacher(id: string, contractFilePath: string | null): Promise<void> {
  if (contractFilePath) {
    await supabase.storage.from(TEACHER_CONTRACTS_BUCKET).remove([contractFilePath])
  }

  const { error } = await supabase.from('teachers').delete().eq('id', id)

  if (error) {
    throw mapError(error, 'Não foi possível excluir o professor.')
  }
}

/** Quantidade de turmas por professor, para a coluna "Turmas" da listagem. */
export async function countClassesByTeacherIds(teacherIds: string[]): Promise<Record<string, number>> {
  if (teacherIds.length === 0) return {}

  const { data, error } = await supabase.from('class_teachers').select('teacher_id').in('teacher_id', teacherIds)

  if (error) throw mapError(error, 'Não foi possível carregar as turmas dos professores.')

  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as Array<{ teacher_id: string }>) {
    counts[row.teacher_id] = (counts[row.teacher_id] ?? 0) + 1
  }
  return counts
}

/** Turmas administradas por um professor, para o formulário e o detalhe. */
export async function listClassesForTeacher(teacherId: string): Promise<TeacherClassSummary[]> {
  const { data, error } = await supabase
    .from('class_teachers')
    .select(
      'class:classes(id, name, status, start_date, end_date, capacity, course:courses(id, name, category_id, category:course_categories(id, name, slug)), unit:units(id, name))',
    )
    .eq('teacher_id', teacherId)

  if (error) {
    throw mapError(error, 'Não foi possível carregar as turmas deste professor.')
  }

  interface Row {
    class: TeacherClassSummary | null
  }

  return ((data ?? []) as unknown as Row[])
    .map((row) => row.class)
    .filter((klass): klass is TeacherClassSummary => klass !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Substitui os vínculos de turma do professor pela lista informada
 * (delete + insert, não há transação multi-statement disponível no client
 * supabase-js — aceitável aqui porque não é um registro financeiro/comercial
 * como enrollments, apenas um vínculo de administração).
 */
export async function setTeacherClasses(teacherId: string, classIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase.from('class_teachers').delete().eq('teacher_id', teacherId)
  if (deleteError) {
    throw mapError(deleteError, 'Não foi possível atualizar as turmas administradas pelo professor.')
  }

  if (classIds.length === 0) return

  const rows = classIds.map((classId) => ({ teacher_id: teacherId, class_id: classId }))
  const { error: insertError } = await supabase.from('class_teachers').insert(rows)
  if (insertError) {
    throw mapError(insertError, 'Não foi possível atualizar as turmas administradas pelo professor.')
  }
}

/**
 * Envia o contrato para o Storage e grava o path/nome na linha do professor.
 * Se já existia um contrato anterior, o objeto antigo é removido primeiro.
 */
export async function uploadTeacherContract(
  teacherId: string,
  file: File,
  previousPath?: string | null,
): Promise<void> {
  const path = `${teacherId}/${Date.now()}-${sanitizeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage.from(TEACHER_CONTRACTS_BUCKET).upload(path, file)
  if (uploadError) {
    throw new Error('Não foi possível enviar o arquivo do contrato. Tente novamente.')
  }

  const { error: updateError } = await supabase
    .from('teachers')
    .update({ contract_file_path: path, contract_file_name: file.name })
    .eq('id', teacherId)

  if (updateError) {
    throw mapError(updateError, 'Não foi possível salvar o contrato do professor.')
  }

  if (previousPath) {
    await supabase.storage.from(TEACHER_CONTRACTS_BUCKET).remove([previousPath])
  }
}

export async function deleteTeacherContract(teacherId: string, contractFilePath: string): Promise<void> {
  await supabase.storage.from(TEACHER_CONTRACTS_BUCKET).remove([contractFilePath])

  const { error } = await supabase
    .from('teachers')
    .update({ contract_file_path: null, contract_file_name: null })
    .eq('id', teacherId)

  if (error) {
    throw mapError(error, 'Não foi possível remover o contrato do professor.')
  }
}

/** URL assinada temporária (60s) para baixar o contrato — bucket privado, sem link permanente. */
export async function getTeacherContractSignedUrl(contractFilePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(TEACHER_CONTRACTS_BUCKET)
    .createSignedUrl(contractFilePath, 60)

  if (error || !data?.signedUrl) {
    throw new Error('Não foi possível gerar o link do contrato. Tente novamente.')
  }

  return data.signedUrl
}

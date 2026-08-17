import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { listActiveCourses } from '@/services/classes.service'
import { createEnrollmentWithSale, createSaleWithInstallments } from '@/services/sales.service'
import { listSellers } from '@/services/students.service'
import { centsToDecimal } from '@/utils/currency'
import type { Course } from '@/types/enrollments'
import type { InstallmentInput, SaleFormTarget } from '@/types/sales'
import { SaleForm } from './components/sale-form'
import { EMPTY_SALE_FORM_VALUES, type SaleFormValues } from './components/sale-form-values'

export function SaleNewPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [courseOptions, setCourseOptions] = useState<Course[]>([])
  const [sellerOptions, setSellerOptions] = useState<{ id: string; full_name: string }[]>([])

  useEffect(() => {
    let active = true
    listActiveCourses()
      .then((courses) => {
        if (active) setCourseOptions(courses)
      })
      .catch(() => {
        if (active) {
          toast({ title: 'Não foi possível carregar os cursos disponíveis.', variant: 'error' })
        }
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    listSellers()
      .then((sellers) => {
        if (active) setSellerOptions(sellers)
      })
      .catch(() => {
        // Lista de vendedores é só para o campo opcional "Vendedor" — falha aqui não deve travar o registro da venda.
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(values: SaleFormValues, installments: InstallmentInput[], target: SaleFormTarget) {
    setSubmitting(true)
    try {
      if (target.mode === 'existing') {
        const { id } = await createSaleWithInstallments({
          enrollment_id: target.enrollmentId,
          total_amount: centsToDecimal(values.total_amount_cents),
          payment_method: values.payment_method,
          payment_plan: values.payment_plan.trim() || null,
          sale_date: values.sale_date,
          installments,
          seller_id: values.seller_id || null,
        })
        toast({ title: 'Venda registrada com sucesso.', variant: 'success' })
        navigate(ROUTES.saleDetail(id))
        return
      }

      const { saleId } = await createEnrollmentWithSale({
        student_id: target.studentId,
        class_id: target.classId,
        enrollment_date: target.enrollmentDate,
        expected_graduation_date: target.expectedGraduationDate,
        total_amount: centsToDecimal(values.total_amount_cents),
        payment_method: values.payment_method,
        payment_plan: values.payment_plan.trim() || null,
        sale_date: values.sale_date,
        installments,
        seller_id: values.seller_id || null,
      })
      toast({ title: 'Matrícula e venda registradas com sucesso.', variant: 'success' })
      navigate(ROUTES.saleDetail(saleId))
    } catch (err) {
      toast({
        title: 'Não foi possível registrar a venda.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell
      user={shellUser}
      breadcrumbItems={[
        { label: 'Vendas', href: ROUTES.sales },
        { label: 'Nova venda', href: ROUTES.saleNew },
      ]}
    >
      <PageHeader
        eyebrow="Vendas"
        title="Nova venda"
        description="Anexe a uma matrícula sem venda registrada, ou crie a matrícula e a venda no mesmo processo."
      />

      <SaleForm
        initialValues={EMPTY_SALE_FORM_VALUES}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.sales)}
        courseOptions={courseOptions}
        sellerOptions={sellerOptions}
      />
    </AppShell>
  )
}

import { getParameter } from '@/src/libs/getParameter'

/**
 * Customer Service = user yang berada di company platform (parameter COMPANY_SUPER).
 * Mereka boleh melihat & membalas semua tiket support.
 */
export async function isCustomerService(companyId: string | null): Promise<boolean> {
  if (!companyId) return false

  const superCompanyId = await getParameter('COMPANY_SUPER')

  return !!superCompanyId && companyId === superCompanyId
}

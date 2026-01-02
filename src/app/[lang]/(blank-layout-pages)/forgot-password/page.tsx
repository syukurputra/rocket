import type { Metadata } from 'next'
import ForgotPassword from '@views/apps/forgot-password/ForgotPassword'

export const metadata: Metadata = {
  title: 'Lupa Password',
  description: 'Reset password akun Anda'
}

const ForgotPasswordPage = () => {
  return <ForgotPassword mode='light' />
}

export default ForgotPasswordPage

import type { Metadata } from 'next'
import ResetPassword from '@views/apps/reset-password/ResetPassword'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Buat password baru untuk akun Anda'
}

const ResetPasswordPage = () => {
  return <ResetPassword mode='light' />
}

export default ResetPasswordPage

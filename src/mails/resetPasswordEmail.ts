import { sendEmail } from '@/src/libs/mailer'

export const sendResetPasswordEmail = async (email: string, username: string, resetToken: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`
  const supportEmail = process.env.SUPPORT_EMAIL || 'notif@bantusewa.com'
  const companyName = process.env.COMPANY_NAME || 'Bantu Sewa'

  const subject = '🔐 Reset Password Akun Anda'

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }

        .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .header p {
            font-size: 16px;
            opacity: 0.9;
        }

        .content {
            padding: 40px 30px;
        }

        .welcome-text {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2c3e50;
        }

        .description {
            font-size: 16px;
            color: #555555;
            margin-bottom: 30px;
            line-height: 1.7;
        }

        .reset-button {
            text-align: center;
            margin: 35px 0;
        }

        .reset-button a {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
            color: white !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
        }

        .alternative-link {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
            padding: 15px;
            margin: 30px 0;
        }

        .alternative-link p {
            font-size: 14px;
            color: #92400e;
            margin-bottom: 10px;
        }

        .alternative-link a {
            color: #f59e0b;
            word-break: break-all;
            font-size: 13px;
        }

        .warning-box {
            background-color: #fee2e2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }

        .warning-box p {
            color: #991b1b;
            font-size: 14px;
            margin: 0;
        }

        .info-box {
            background-color: #dbeafe;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
            padding: 16px;
            margin: 20px 0;
        }

        .info-box p {
            color: #1e40af;
            font-size: 14px;
            margin: 0;
        }

        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }

        .footer p {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .footer a {
            color: #f59e0b;
            text-decoration: none;
        }

        .divider {
            height: 1px;
            background-color: #e9ecef;
            margin: 30px 0;
        }

        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }

            .header, .content, .footer {
                padding: 30px 20px;
            }

            .header h1 {
                font-size: 24px;
            }

            .reset-button a {
                padding: 14px 30px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-icon">🔐</div>
            <h1>Reset Password</h1>
            <p>Permintaan untuk mengatur ulang password Anda</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p class="welcome-text">Halo ${username}! 👋</p>

            <p class="description">
                Kami menerima permintaan untuk mereset password akun Anda di <strong>${companyName}</strong>.
            </p>

            <p class="description">
                Jika Anda yang meminta reset password, klik tombol di bawah ini untuk membuat password baru:
            </p>

            <!-- Reset Button -->
            <div class="reset-button">
                <a href="${resetUrl}" target="_blank">
                    🔓 Reset Password Saya
                </a>
            </div>

            <!-- Alternative Link -->
            <div class="alternative-link">
                <p><strong>Atau salin dan tempel tautan ini ke browser Anda:</strong></p>
                <a href="${resetUrl}">${resetUrl}</a>
            </div>

            <!-- Warning Box -->
            <div class="warning-box">
                <p><strong>⚠️ Penting:</strong> Tautan reset password ini akan kedaluwarsa dalam <strong>1 jam</strong>.</p>
            </div>

            <!-- Info Box -->
            <div class="info-box">
                <p><strong>ℹ️ Catatan Keamanan:</strong> Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tetap aman dan tidak akan berubah.</p>
            </div>

            <div class="divider"></div>

            <p style="color: #666666; font-size: 14px;">
                Untuk keamanan akun Anda, jangan bagikan link ini kepada siapa pun.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>Jika Anda mengalami masalah, hubungi <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
                &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`

  const textContent = `
Halo ${username}!

Kami menerima permintaan untuk mereset password akun Anda di ${companyName}.

Jika Anda yang meminta reset password, kunjungi link berikut untuk membuat password baru:

${resetUrl}

PENTING: Tautan ini akan kedaluwarsa dalam 1 jam.

Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tetap aman dan tidak akan berubah.

Untuk keamanan akun Anda, jangan bagikan link ini kepada siapa pun.

Salam,
${companyName}

---
Jika Anda mengalami masalah, hubungi ${supportEmail}
  `

  return await sendEmail({
    to: email,
    subject: subject,
    html: htmlContent,
    text: textContent
  })
}

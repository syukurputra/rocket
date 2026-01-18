import { sendEmail } from '@/src/libs/mailer'

export const sendInvitationEmail = async (email: string, companyName: string, roleName: string, token: string) => {
  const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invitation/accept?token=${token}`
  const supportEmail = process.env.SUPPORT_EMAIL || 'notif@bantusewa.com'

  const subject = `Undangan Bergabung dengan ${companyName}`

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Undangan Tim</title>
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
            background-color: #f5f5f5;
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
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
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

        .invite-button {
            text-align: center;
            margin: 40px 0;
        }

        .invite-button a {
            display: inline-block;
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            color: white !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
        }

        .alternative-link {
            background-color: #f9fafb;
            border-left: 4px solid #7c3aed;
            border-radius: 4px;
            padding: 15px;
            margin: 30px 0;
        }

        .alternative-link p {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
        }

        .alternative-link a {
            color: #7c3aed;
            word-break: break-all;
            font-size: 13px;
        }

        .info-box {
            background-color: #fef3c7;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }

        .info-box p {
            color: #92400e;
            font-size: 14px;
            margin: 0;
        }

        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }

        .footer p {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .footer a {
            color: #7c3aed;
            text-decoration: none;
        }

        .divider {
            height: 1px;
            background-color: #e5e7eb;
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

            .invite-button a {
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
            <div class="header-icon">📧</div>
            <h1>Undangan Tim</h1>
            <p>Konfirmasi undangan Anda untuk bergabung</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p class="welcome-text">Halo! 👋</p>

            <p class="description">
                Anda telah diundang untuk bergabung dengan <strong>${companyName}</strong> sebagai <strong>${roleName}</strong>.
            </p>

            <p class="description">
                Untuk menyelesaikan pendaftaran dan mengaktifkan akun Anda, silakan klik tombol di bawah ini:
            </p>

            <!-- Invite Button -->
            <div class="invite-button">
                <a href="${invitationUrl}" target="_blank">
                    🎯 Terima Undangan
                </a>
            </div>

            <!-- Alternative Link -->
            <div class="alternative-link">
                <p>Atau salin dan tempel tautan ini ke browser Anda:</p>
                <a href="${invitationUrl}">${invitationUrl}</a>
            </div>

            <!-- Info Box -->
            <div class="info-box">
                <p><strong>Catatan:</strong> Tautan undangan ini akan kedaluwarsa dalam 7 hari.</p>
            </div>

            <div class="divider"></div>

            <p style="color: #666666; font-size: 14px;">
                Jika Anda tidak membuat akun di platform kami, silakan abaikan email ini.
                Akun tidak akan dibuat tanpa verifikasi email.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Bantu Sewa</strong></p>
            <p>Jika Anda mengalami masalah, hubungi <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
                &copy; ${new Date().getFullYear()} Bantu Sewa. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`

  const textContent = `
Halo!

Anda telah diundang untuk bergabung dengan ${companyName} sebagai ${roleName}.

Untuk menyelesaikan pendaftaran dan mengaktifkan akun Anda, silakan kunjungi link berikut:

${invitationUrl}

Tautan undangan ini akan kedaluwarsa dalam 7 hari.

Jika Anda tidak membuat akun di platform kami, silakan abaikan email ini.

Salam,
Bantu Sewa
  `

  return await sendEmail({
    to: email,
    subject: subject,
    html: htmlContent,
    text: textContent
  })
}

import { sendEmail } from '@/src/libs/mailer'

export const sendConfirmationEmail = async (email: string, username: string, companyName: string) => {
  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/login`
  const supportEmail = process.env.SUPPORT_EMAIL || 'notif@bantusewa.com'

  const subject = `Selamat Datang di ${companyName} - Akun Diaktifkan`

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Selamat Datang di ${companyName}</title>
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
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
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

        .login-button {
            text-align: center;
            margin: 40px 0;
        }

        .login-button a {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            color: white !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }

        .credentials-box {
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
            border-radius: 4px;
            padding: 20px;
            margin: 30px 0;
        }

        .credentials-box h3 {
            font-size: 15px;
            font-weight: bold;
            color: #065f46;
            margin-bottom: 10px;
        }

        .credentials-box p {
            font-size: 14px;
            color: #555555;
            line-height: 1.8;
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
            color: #10b981;
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

            .login-button a {
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
            <div class="header-icon">🎉</div>
            <h1>Akun Diaktifkan!</h1>
            <p>Selamat datang di ${companyName}</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p class="welcome-text">Halo <strong>${username}</strong>! 👋</p>

            <p class="description">
                Akun Anda di <strong>${companyName}</strong> telah berhasil diaktifkan!
            </p>

            <p class="description">
                Anda sekarang dapat masuk untuk mengakses dashboard dan mulai menggunakan platform.
            </p>

            <!-- Login Button -->
            <div class="login-button">
                <a href="${loginUrl}" target="_blank">
                    🚀 Masuk ke Akun
                </a>
            </div>

            <!-- Credentials Box -->
            <div class="credentials-box">
                <h3>Kredensial Login Anda:</h3>
                <p>
                    <strong>Username:</strong> ${username}<br>
                    <strong>Email:</strong> ${email}
                </p>
            </div>

            <div class="divider"></div>

            <p style="color: #666666; font-size: 14px;">
                Jika Anda memiliki pertanyaan, silakan hubungi administrator Anda.
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
Halo ${username}!

Akun Anda di ${companyName} telah berhasil diaktifkan!

Anda sekarang dapat masuk untuk mengakses dashboard dan mulai menggunakan platform.

Kredensial Login Anda:
Username: ${username}
Email: ${email}

Untuk masuk, kunjungi: ${loginUrl}

Jika Anda memiliki pertanyaan, silakan hubungi administrator Anda.

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

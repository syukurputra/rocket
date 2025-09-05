import { sendEmail } from '@/src/libs/mailer';

export const verifyEmailConnection = async (id: string, email: string, username: string) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verifikasi?token=${id}`;
  const companyName = process.env.COMPANY_NAME || 'Bantu Sewa';
  const supportEmail = process.env.SUPPORT_EMAIL || 'notif@bantusewa.com';

  const subject = '🔐 Verifikasi Email Anda';

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Email</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
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

        .verify-button {
            text-align: center;
            margin: 35px 0;
        }

        .verify-button a {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .alternative-link {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }

        .alternative-link p {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
        }

        .alternative-link a {
            color: #667eea;
            word-break: break-all;
            font-size: 14px;
        }

        .info-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }

        .info-box p {
            color: #856404;
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

        .social-links {
            margin-top: 20px;
        }

        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #6c757d;
            text-decoration: none;
            font-size: 14px;
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

            .verify-button a {
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
            <h1>✉️ Verifikasi Email</h1>
            <p>Konfirmasi alamat email Anda untuk melanjutkan</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p class="welcome-text">Halo ${username}! 👋</p>

            <p class="description">
                Terima kasih telah mendaftar di platform kami. Untuk menyelesaikan proses pendaftaran dan mengamankan akun anda, silakan verifikasi alamat email anda dengan mengklik tombol di bawah ini.
            </p>

            <!-- Verify Button -->
            <div class="verify-button">
                <a href="${verificationUrl}" target="_blank">
                    🔐 Verifikasi Email Saya
                </a>
            </div>

            <div class="divider"></div>

            <p style="color: #666666; font-size: 14px;">
                Jika Anda tidak membuat akun di platform kami, silakan abaikan email ini.
                Akun tidak akan dibuat tanpa verifikasi email.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>Jika Anda mengalami masalah, hubungi <a href="mailto:${supportEmail}" style="color: #667eea;">${supportEmail}</a></p>
        </div>
    </div>
</body>
</html>
`;

  const textContent = `
Halo ${username}!

Terima kasih telah mendaftar di platform kami.

Untuk menyelesaikan proses pendaftaran, silakan verifikasi alamat email Anda dengan mengunjungi link berikut:

${verificationUrl}

Link verifikasi ini akan kedaluwarsa dalam 24 jam.

Jika Anda tidak membuat akun di platform kami, silakan abaikan email ini.

Salam,
${companyName}
  `;

  return await sendEmail({
    to: email,
    subject: subject,
    html: htmlContent,
    text: textContent
  });
};

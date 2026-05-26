import { sendEmail } from '@/src/libs/mailer'

export const sendTagihanNotificationEmail = async (
  email: string,
  penyewaName: string,
  keterangan: string,
  mulaiSewa: string,
  selesaiSewa: string,
  nominal: number,
  status: string
) => {
  const supportEmail = process.env.SUPPORT_EMAIL || 'notif@bantusewa.com'

  const subject = `Tagihan Baru - ${keterangan}`

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tagihan Baru</title>
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
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
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

        .bill-details {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
            padding: 20px;
            margin: 30px 0;
        }

        .bill-details h3 {
            font-size: 15px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
        }

        .bill-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e7ff;
        }

        .bill-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #1e40af;
            margin-top: 10px;
            padding-top: 15px;
            border-top: 2px solid #3b82f6;
        }

        .bill-label {
            color: #64748b;
        }

        .bill-value {
            color: #1e293b;
            font-weight: 500;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }

        .status-unpaid {
            background-color: #fef3c7;
            color: #92400e;
        }

        .status-paid {
            background-color: #d1fae5;
            color: #065f46;
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
            color: #3b82f6;
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

            .bill-row {
                flex-direction: column;
                gap: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-icon">📄</div>
            <h1>Tagihan Baru</h1>
            <p>${keterangan}</p>
        </div>

        <!-- Content -->
        <div class="content">
            <p class="welcome-text">Halo <strong>${penyewaName}</strong>! 👋</p>

            <p class="description">
                Anda memiliki tagihan baru yang perlu diselesaikan. Berikut adalah detail tagihan Anda:
            </p>

            <!-- Bill Details -->
            <div class="bill-details">
                <h3>Detail Tagihan</h3>
                <div class="bill-row">
                    <span class="bill-label">Keterangan:</span>
                    <span class="bill-value">${keterangan}</span>
                </div>
                <div class="bill-row">
                    <span class="bill-label">Periode Sewa:</span>
                    <span class="bill-value">${formatDate(mulaiSewa)} - ${formatDate(selesaiSewa)}</span>
                </div>
                <div class="bill-row">
                    <span class="bill-label">Status:</span>
                    <span class="status-badge ${status === 'LUNAS' ? 'status-paid' : 'status-unpaid'}">
                        ${status === 'LUNAS' ? 'Lunas' : 'Belum Terbayar'}
                    </span>
                </div>
                <div class="bill-row">
                    <span class="bill-label">Total Pembayaran:</span>
                    <span class="bill-value">${formatCurrency(nominal)}</span>
                </div>
            </div>

            <div class="divider"></div>

            <p style="color: #666666; font-size: 14px;">
                Silakan lakukan pembayaran sesuai dengan nominal yang tertera. Jika Anda memiliki pertanyaan, silakan hubungi administrator.
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
Halo ${penyewaName}!

Anda memiliki tagihan baru yang perlu diselesaikan.

Detail Tagihan:
Keterangan: ${keterangan}
Periode Sewa: ${formatDate(mulaiSewa)} - ${formatDate(selesaiSewa)}
Status: ${status === 'LUNAS' ? 'Lunas' : 'Belum Terbayar'}
Total Pembayaran: ${formatCurrency(nominal)}

Silakan lakukan pembayaran sesuai dengan nominal yang tertera.

Jika Anda memiliki pertanyaan, silakan hubungi administrator.

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

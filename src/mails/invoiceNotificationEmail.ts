import { sendEmail } from '@/src/libs/mailer'

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}

type InvoiceEmailType = 'PENDING' | 'PAID' | 'CANCELLED'

interface InvoiceEmailData {
  nomorInvoice: string
  userName: string
  paketName: string
  billingCycle: string
  subtotal: number
  pajak: number
  total: number
  tanggalInvoice: string | Date
  tanggalJatuhTempo: string | Date
  catatan?: string | null
}

const getEmailConfig = (type: InvoiceEmailType) => {
  switch (type) {
    case 'PENDING':
      return {
        subject: (inv: string) => `📋 Invoice ${inv} - Menunggu Pembayaran`,
        headerGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        headerIcon: '⏳',
        headerTitle: 'Menunggu Pembayaran',
        headerDesc: 'Invoice baru telah dibuat',
        statusBadgeBg: '#fef3c7',
        statusBadgeColor: '#92400e',
        statusLabel: 'Menunggu Pembayaran',
        messageText: (data: InvoiceEmailData) =>
          `Invoice langganan paket <strong>${data.paketName}</strong> telah berhasil dibuat. Silakan lakukan pembayaran sebelum tanggal jatuh tempo.`
      }
    case 'PAID':
      return {
        subject: (inv: string) => `✅ Invoice ${inv} - Pembayaran Lunas`,
        headerGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        headerIcon: '✅',
        headerTitle: 'Pembayaran Lunas',
        headerDesc: 'Pembayaran Anda telah dikonfirmasi',
        statusBadgeBg: '#d1fae5',
        statusBadgeColor: '#065f46',
        statusLabel: 'Lunas',
        messageText: (data: InvoiceEmailData) =>
          `Pembayaran untuk paket <strong>${data.paketName}</strong> telah dikonfirmasi. Terima kasih atas pembayaran Anda!`
      }
    case 'CANCELLED':
      return {
        subject: (inv: string) => `❌ Invoice ${inv} - Dibatalkan`,
        headerGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        headerIcon: '❌',
        headerTitle: 'Invoice Dibatalkan',
        headerDesc: 'Invoice telah dibatalkan',
        statusBadgeBg: '#fee2e2',
        statusBadgeColor: '#991b1b',
        statusLabel: 'Dibatalkan',
        messageText: (data: InvoiceEmailData) =>
          `Invoice untuk paket <strong>${data.paketName}</strong> telah dibatalkan.${data.catatan ? ` Alasan: <em>${data.catatan}</em>` : ''}`
      }
  }
}

export async function sendInvoiceNotificationEmail(
  to: string,
  type: InvoiceEmailType,
  data: InvoiceEmailData
): Promise<{ success: boolean; messageId?: string; error?: string; message: string }> {
  const config = getEmailConfig(type)
  const siklus = data.billingCycle === 'annually' ? 'Tahunan' : 'Bulanan'

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.headerTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">

              <!-- Header -->
              <tr>
                <td style="background: ${config.headerGradient}; padding: 40px 30px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 16px;">${config.headerIcon}</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${config.headerTitle}</h1>
                  <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">${config.headerDesc}</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Halo <strong>${data.userName}</strong>,
                  </p>

                  <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                    ${config.messageText(data)}
                  </p>

                  <!-- Detail Box -->
                  <div style="background-color: #f9fafb; border-left: 4px solid #6366f1; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                    <h2 style="margin: 0 0 20px; color: #6366f1; font-size: 18px; font-weight: 600;">Detail Invoice</h2>

                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">No. Invoice:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.nomorInvoice}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Paket:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.paketName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Siklus:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${siklus}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tanggal Invoice:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formatDate(data.tanggalInvoice)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Jatuh Tempo:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formatDate(data.tanggalJatuhTempo)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status:</td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="background-color: ${config.statusBadgeBg}; color: ${config.statusBadgeColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${config.statusLabel}</span>
                        </td>
                      </tr>
                      <tr style="border-top: 1px solid #e5e7eb;">
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(data.subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">PPN (11%):</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(data.pajak)}</td>
                      </tr>
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 16px 0 8px; color: #1f2937; font-size: 16px; font-weight: 600;">Total:</td>
                        <td style="padding: 16px 0 8px; color: #6366f1; font-size: 20px; font-weight: 700; text-align: right;">${formatCurrency(data.total)}</td>
                      </tr>
                    </table>
                  </div>



                  ${data.catatan && type === 'CANCELLED' ? `
                  <!-- Catatan -->
                  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      <strong>Catatan:</strong> ${data.catatan}
                    </p>
                  </div>
                  ` : ''}

                  <p style="margin: 0 0 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                    Jika Anda memiliki pertanyaan atau memerlukan bantuan, jangan ragu untuk menghubungi kami.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                    Email ini dikirim secara otomatis, mohon tidak membalas email ini.
                  </p>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Jika Anda memerlukan bantuan, hubungi kami di
                    <a href="mailto:${process.env.SUPPORT_EMAIL || 'notif@bantusewa.com'}" style="color: #6366f1; text-decoration: none;">${process.env.SUPPORT_EMAIL || 'notif@bantusewa.com'}</a>
                  </p>
                  <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Rocket Property Management System. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const textContent = `
${config.headerTitle} - ${data.nomorInvoice}

Halo ${data.userName},

${type === 'PENDING' ? `Invoice langganan paket ${data.paketName} telah berhasil dibuat. Silakan lakukan pembayaran sebelum tanggal jatuh tempo.` : ''}${type === 'PAID' ? `Pembayaran untuk paket ${data.paketName} telah dikonfirmasi. Terima kasih!` : ''}${type === 'CANCELLED' ? `Invoice untuk paket ${data.paketName} telah dibatalkan.${data.catatan ? ` Alasan: ${data.catatan}` : ''}` : ''}

Detail Invoice:
------------------
No. Invoice: ${data.nomorInvoice}
Paket: ${data.paketName} (${siklus})
Tanggal: ${formatDate(data.tanggalInvoice)}
Jatuh Tempo: ${formatDate(data.tanggalJatuhTempo)}
Status: ${config.statusLabel}

Subtotal: ${formatCurrency(data.subtotal)}
PPN (11%): ${formatCurrency(data.pajak)}
Total: ${formatCurrency(data.total)}
---
Email ini dikirim secara otomatis.
© ${new Date().getFullYear()} Rocket Property Management System.
  `

  return await sendEmail({
    to,
    subject: config.subject(data.nomorInvoice),
    html: htmlContent,
    text: textContent
  })
}

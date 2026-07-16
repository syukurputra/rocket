import { sendEmail } from '@/src/libs/mailer'

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export const sendPaymentConfirmationEmail = async (
  email: string,
  penyewaName: string,
  keterangan: string,
  mulaiSewa: string,
  selesaiSewa: string,
  nominal: number,
  metodeBayar?: string,
  nomorBooking?: string
) => {
  const formattedAmount = formatCurrency(nominal)
  const formattedStartDate = formatDate(mulaiSewa)
  const formattedEndDate = formatDate(selesaiSewa)
  const paymentMethod = metodeBayar ? (metodeBayar === 'transfer' ? 'Transfer Bank' : 'Cash') : '-'

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Konfirmasi Pembayaran</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                  <div style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Pembayaran Berhasil</h1>
                  <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">${keterangan}</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Halo <strong>${penyewaName}</strong>! 👋
                  </p>

                  <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Terima kasih atas pembayaran Anda. Tagihan Anda telah <strong style="color: #10b981;">LUNAS</strong>. Berikut adalah detail pembayaran Anda:
                  </p>

                  <!-- Detail Box -->
                  <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                    <h2 style="margin: 0 0 20px; color: #10b981; font-size: 18px; font-weight: 600;">Detail Pembayaran</h2>

                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Keterangan:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${keterangan}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Periode Sewa:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formattedStartDate} - ${formattedEndDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Metode Pembayaran:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status:</td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Lunas</span>
                        </td>
                      </tr>
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 16px 0 8px; color: #1f2937; font-size: 16px; font-weight: 600;">Total Pembayaran:</td>
                        <td style="padding: 16px 0 8px; color: #10b981; font-size: 20px; font-weight: 700; text-align: right;">${formattedAmount}</td>
                      </tr>
                    </table>
                  </div>

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
                    <a href="mailto:notif@bantusewa.com" style="color: #10b981; text-decoration: none;">notif@bantusewa.com</a>
                  </p>
                  <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px;">
                    © 2025 by Bantu Sewa. All rights reserved.
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
Pembayaran Berhasil - ${keterangan}

Halo ${penyewaName}!

Terima kasih atas pembayaran Anda. Tagihan Anda telah LUNAS.

Detail Pembayaran:
------------------
Keterangan: ${keterangan}
Periode Sewa: ${formattedStartDate} - ${formattedEndDate}
Metode Pembayaran: ${paymentMethod}
Status: Lunas

Total Pembayaran: ${formattedAmount}

Jika Anda memiliki pertanyaan atau memerlukan bantuan, jangan ragu untuk menghubungi kami.

---
Email ini dikirim secara otomatis, mohon tidak membalas email ini.
Jika Anda memerlukan bantuan, hubungi kami di notif@bantusewa.com

© 2025 by Bantu Sewa. All rights reserved.
  `

  return await sendEmail({
    to: email,
    subject: `Pembayaran Lunas - ${nomorBooking || keterangan}`,
    html: htmlContent,
    text: textContent
  })
}

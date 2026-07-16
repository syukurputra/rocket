import { sendEmail } from '@/src/libs/mailer'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

type BookingCreatedParams = {
  nomorBooking: string
  namaPemesan: string
  namaAset: string
  namaItemAset: string
  periodeSewa: string
  mulaiSewa: string
  selesaiSewa: string
  total: number
  paymentUrl?: string
}

export async function sendBookingCreatedEmail(to: string, params: BookingCreatedParams) {
  const { nomorBooking, namaPemesan, namaAset, namaItemAset, periodeSewa, mulaiSewa, selesaiSewa, total, paymentUrl } = params

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Booking Berhasil</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;border-collapse:collapse;background:#fff;box-shadow:0 4px 6px rgba(0,0,0,.1);border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6359e9 0%,#4f46e5 100%);padding:40px 30px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:1px;">INFORMASI SEWA PEMESANAN</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:15px;">Nomor Booking: <strong>${nomorBooking}</strong></p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:36px 30px;">
            <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
              Halo <strong>${namaPemesan}</strong>! 👋
            </p>
            <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.6;">
              Booking Anda telah berhasil dibuat. Berikut adalah detail booking yang perlu segera dilakukan pembayaran:
            </p>

            <!-- Detail Box -->
            <div style="background:#f9fafb;border-left:4px solid #6359e9;padding:20px;margin-bottom:28px;border-radius:4px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;width:45%;">Nomor Booking</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${nomorBooking}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Nama Aset</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${namaAset}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Item Aset</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${namaItemAset}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Periode Sewa</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${periodeSewa.charAt(0).toUpperCase() + periodeSewa.slice(1)}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Mulai Sewa</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${fmtDate(mulaiSewa)}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Selesai Sewa</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${fmtDate(selesaiSewa)}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Status</td>
                  <td style="padding:8px 0;text-align:right;">
                    <span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:10px;font-size:12px;font-weight:600;">Menunggu Pembayaran</span>
                  </td>
                </tr>
                <tr style="border-top:2px solid #e5e7eb;">
                  <td style="padding:14px 0 8px;color:#1f2937;font-size:16px;font-weight:600;">Total Pembayaran</td>
                  <td style="padding:14px 0 8px;color:#6359e9;font-size:20px;font-weight:700;text-align:right;">${fmt(total)}</td>
                </tr>
              </table>
            </div>

            ${paymentUrl ? `
            <div style="text-align:center;margin-top:8px;">
              <a href="${paymentUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6359e9 0%,#4f46e5 100%);color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 48px;border-radius:8px;letter-spacing:.5px;">Bayar Sekarang</a>
              <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;">Klik tombol di atas untuk menyelesaikan pembayaran</p>
            </div>
            ` : `
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px;">
              <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.6;">
                Tim kami akan segera menghubungi Anda untuk konfirmasi dan instruksi pembayaran.
              </p>
            </div>
            `}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 30px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Bantu Sewa — Platform Manajemen Sewa</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return sendEmail({
    to,
    subject: `Booking Berhasil - ${nomorBooking}`,
    html
  })
}

import { sendEmail } from '@/src/libs/mailer'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

type BookingPaymentOwnerParams = {
  nomorBooking: string
  namaPemesan: string
  namaAset: string
  namaRuangan: string
  periodeSewa: string
  mulaiSewa: string
  selesaiSewa: string
  total: number
}

export async function sendBookingPaymentOwnerEmail(to: string, params: BookingPaymentOwnerParams) {
  const { nomorBooking, namaPemesan, namaAset, namaRuangan, periodeSewa, mulaiSewa, selesaiSewa, total } = params

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Pembayaran Booking Berhasil</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;border-collapse:collapse;background:#fff;box-shadow:0 4px 6px rgba(0,0,0,.1);border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 30px;text-align:center;">
            <div style="background:rgba(255,255,255,.2);width:72px;height:72px;margin:0 auto 16px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:600;">Pembayaran Booking Berhasil</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:15px;">Nomor Booking: <strong>${nomorBooking}</strong></p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:36px 30px;">
            <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
              Halo, ada pembayaran booking baru yang telah berhasil dikonfirmasi.
            </p>

            <!-- Detail Box -->
            <div style="background:#f9fafb;border-left:4px solid #10b981;padding:20px;margin-bottom:28px;border-radius:4px;">
              <h3 style="margin:0 0 16px;color:#10b981;font-size:16px;font-weight:600;">Detail Booking</h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;width:45%;">Nomor Booking</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${nomorBooking}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Nama Pemesan</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${namaPemesan}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Aset</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${namaAset}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Item Aset</td>
                  <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;">${namaRuangan}</td>
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
                <tr style="border-top:2px solid #e5e7eb;">
                  <td style="padding:14px 0 8px;color:#1f2937;font-size:16px;font-weight:600;">Total Pembayaran</td>
                  <td style="padding:14px 0 8px;color:#10b981;font-size:20px;font-weight:700;text-align:right;">${fmt(total)}</td>
                </tr>
              </table>
            </div>

            <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;padding:16px;">
              <p style="margin:0;color:#065f46;font-size:14px;line-height:1.6;">
                ✅ Pembayaran telah dikonfirmasi. Silakan cek halaman Booking untuk melihat detail lengkap.
              </p>
            </div>
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
    subject: `Pembayaran Booking Berhasil - ${nomorBooking} | ${namaPemesan}`,
    html
  })
}

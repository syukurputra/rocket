import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SERVER,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export async function sendPaymentInstructionEmail(
  to: string,
  penghuniName: string,
  tagihanKeterangan: string,
  periodeMulai: string,
  periodeSelesai: string,
  nominal: number,
  paymentUrl: string
): Promise<void> {
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
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Instruksi Pembayaran Tagihan</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 3px solid #4CAF50;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #4CAF50;
          margin: 0;
          font-size: 28px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .info-box {
          background-color: #f9f9f9;
          border-left: 4px solid #4CAF50;
          padding: 15px;
          margin: 20px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #666;
        }
        .info-value {
          color: #333;
          text-align: right;
        }
        .total-amount {
          background-color: #4CAF50;
          color: white;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
          margin: 20px 0;
          font-size: 24px;
          font-weight: bold;
        }
        .payment-button {
          display: block;
          width: 100%;
          padding: 15px;
          background-color: #FF6B6B;
          color: white;
          text-align: center;
          text-decoration: none;
          border-radius: 5px;
          font-size: 18px;
          font-weight: bold;
          margin: 30px 0;
          transition: background-color 0.3s;
        }
        .payment-button:hover {
          background-color: #FF5252;
        }
        .instructions {
          background-color: #FFF9E6;
          border: 1px solid #FFE082;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
        }
        .instructions h3 {
          color: #F57C00;
          margin-top: 0;
        }
        .instructions ol {
          margin: 10px 0;
          padding-left: 20px;
        }
        .instructions li {
          margin: 8px 0;
        }
        .payment-methods {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 15px 0;
        }
        .payment-method {
          background-color: #E3F2FD;
          padding: 8px 15px;
          border-radius: 20px;
          font-size: 14px;
          color: #1976D2;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .warning {
          background-color: #FFEBEE;
          border-left: 4px solid #F44336;
          padding: 15px;
          margin: 20px 0;
          color: #C62828;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 Tagihan Pembayaran</h1>
        </div>

        <div class="greeting">
          Halo <strong>${penghuniName}</strong>,
        </div>

        <p>Anda memiliki tagihan yang perlu dibayarkan. Berikut adalah detail tagihan Anda:</p>

        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Keterangan:</span>
            <span class="info-value">${tagihanKeterangan}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Periode:</span>
            <span class="info-value">${formatDate(periodeMulai)} - ${formatDate(periodeSelesai)}</span>
          </div>
        </div>

        <div class="total-amount">
          Total: ${formatCurrency(nominal)}
        </div>

        <a href="${paymentUrl}" class="payment-button">
          🔒 BAYAR SEKARANG
        </a>

        <div class="instructions">
          <h3>📋 Cara Pembayaran:</h3>
          <ol>
            <li>Klik tombol <strong>"BAYAR SEKARANG"</strong> di atas</li>
            <li>Anda akan diarahkan ke halaman pembayaran yang aman</li>
            <li>Pilih metode pembayaran yang Anda inginkan</li>
            <li>Ikuti instruksi pembayaran sesuai metode yang dipilih</li>
            <li>Setelah pembayaran berhasil, Anda akan menerima email konfirmasi</li>
          </ol>
        </div>

        <div>
          <h3>💳 Metode Pembayaran yang Tersedia:</h3>
          <div class="payment-methods">
            <span class="payment-method">💳 Kartu Kredit/Debit</span>
            <span class="payment-method">🏦 Transfer Bank</span>
            <span class="payment-method">📱 E-Wallet (GoPay, OVO, DANA)</span>
            <span class="payment-method">🏪 Indomaret/Alfamart</span>
            <span class="payment-method">💰 Kredivo/Akulaku</span>
          </div>
        </div>

        <div class="warning">
          <strong>⚠️ Penting:</strong> Link pembayaran ini bersifat unik untuk tagihan Anda. Jangan bagikan link ini kepada orang lain.
        </div>

        <div class="footer">
          <p>Jika Anda memiliki pertanyaan atau mengalami kesulitan dalam pembayaran, silakan hubungi kami.</p>
          <p style="margin-top: 15px;">
            <strong>Terima kasih atas kepercayaan Anda!</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"Bantu Sewa" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Tagihan Pembayaran - ${tagihanKeterangan}`,
    html: htmlContent
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Payment instruction email sent successfully to:', to)
  } catch (error) {
    console.error('Error sending payment instruction email:', error)
    throw new Error('Failed to send payment instruction email')
  }
}

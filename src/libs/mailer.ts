import nodemailer, { type Transporter } from 'nodemailer';

declare global {
  // biar TypeScript nggak protes saat pakai globalThis
  // eslint-disable-next-line no-var
  var _mailer: Transporter | undefined;
}

/**
 * Factory untuk buat transporter baru
 */
function createTransporter(): Transporter {
  const { MAIL_SERVER, EMAIL_USER, EMAIL_PASSWORD } = process.env;
  if (!MAIL_SERVER || !EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error('Missing MAIL_SERVER/EMAIL_USER/EMAIL_PASSWORD envs');
  }

  return nodemailer.createTransport({
    host: MAIL_SERVER,
    port: 465, // SSL
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
    // opsional: hemat handshake
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    tls: { rejectUnauthorized: false }, // sering dibutuhkan Hostinger
  });
}

/**
 * Singleton transporter — dibuat LAZY (saat pertama dipakai), bukan saat import.
 * Penting: kalau dibuat saat import, `next build` (tahap "Collecting page data")
 * akan meng-evaluate modul ini dan throw kalau env mail belum ada → build gagal.
 * Env mail hanya divalidasi saat benar-benar mengirim email (runtime).
 */
export function getTransporter(): Transporter {
  if (!globalThis._mailer) {
    globalThis._mailer = createTransporter();
  }
  return globalThis._mailer;
}

/**
 * Cek koneksi (opsional)
 */
export async function verifyMailer() {
  return getTransporter().verify();
}

type SendArgs = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

/**
 * Fungsi utama kirim email
 */
export async function sendEmail({
                                  to,
                                  subject,
                                  text,
                                  html,
                                  from = process.env.EMAIL_USER,
                                }: SendArgs) {
  try {
    const info = await getTransporter().sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId, message: 'Email berhasil dikirim' };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err), message: 'Gagal mengirim email' };
  }
}

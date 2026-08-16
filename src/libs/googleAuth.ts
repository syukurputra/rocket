import prisma from '@/src/libs/prisma'

/**
 * Helper login Google untuk klien non-web (aplikasi mobile).
 *
 * Alur web (`/api/auth/google` + `/callback`) memakai authorization code:
 * browser diarahkan ke Google, lalu backend menukar `code` jadi token. Aplikasi
 * mobile tidak bisa memakai alur itu — Google memblokir OAuth di WebView, dan
 * redirect balik ke aplikasi butuh App Links.
 *
 * Karena itu mobile memakai jalur berbeda: SDK Google native yang sudah
 * memegang ID token, lalu ID token itu dikirim ke sini untuk diverifikasi.
 */

/** Paket bawaan untuk user baru; sama dengan yang dipakai alur web. */
const PAKET_DEFAULT = process.env.GOOGLE_DEFAULT_PAKET_ID || 'cmkzpagu800015k6czrtvc7f4'

export type ProfilGoogle = {
  email: string
  nama: string | null
}

export class GoogleAuthError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'GoogleAuthError'
  }
}

/** Daftar client ID yang boleh menjadi audience token. */
function audienceDiizinkan(): string[] {
  const daftar = [
    // Web client ID. Aplikasi mobile memakai ini sebagai `serverClientId`,
    // sehingga `aud` pada ID token berisi nilai ini — bukan client ID Android.
    process.env.GOOGLE_CLIENT_ID,

    // Cadangan kalau ada klien lain (mis. iOS) yang perlu diizinkan.
    ...(process.env.GOOGLE_MOBILE_CLIENT_IDS || '').split(',')
  ]

  return daftar.map(v => (v || '').trim()).filter(Boolean)
}

/**
 * Memverifikasi ID token ke Google dan mengembalikan profil di dalamnya.
 *
 * Verifikasi WAJIB dilakukan di server. ID token adalah satu-satunya bukti
 * bahwa pemanggil benar-benar pemilik akun Google itu; kalau backend hanya
 * percaya pada email yang dikirim klien, siapa pun bisa mengaku sebagai
 * siapa saja hanya dengan mengirim email orang lain.
 */
export async function verifikasiIdTokenGoogle(idToken: string): Promise<ProfilGoogle> {
  const respons = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  )

  if (!respons.ok) {
    throw new GoogleAuthError('Token Google tidak valid atau sudah kedaluwarsa', 401)
  }

  const data = (await respons.json()) as {
    aud?: string
    iss?: string
    email?: string
    email_verified?: string | boolean
    name?: string
  }

  const diizinkan = audienceDiizinkan()

  if (diizinkan.length === 0) {
    throw new GoogleAuthError('GOOGLE_CLIENT_ID belum diset di server', 500)
  }

  // Tanpa pemeriksaan audience, token yang diterbitkan untuk aplikasi LAIN
  // juga akan diterima di sini.
  if (!data.aud || !diizinkan.includes(data.aud)) {
    throw new GoogleAuthError('Token Google bukan untuk aplikasi ini', 401)
  }

  if (data.iss !== 'accounts.google.com' && data.iss !== 'https://accounts.google.com') {
    throw new GoogleAuthError('Penerbit token Google tidak dikenali', 401)
  }

  // tokeninfo mengirim email_verified sebagai string 'true'/'false'.
  const emailTerverifikasi = data.email_verified === true || data.email_verified === 'true'

  if (!data.email || !emailTerverifikasi) {
    throw new GoogleAuthError('Email akun Google belum terverifikasi', 401)
  }

  return { email: data.email, nama: data.name || null }
}

/** Username unik dari bagian depan email, ditambah angka kalau sudah terpakai. */
async function buatUsername(email: string): Promise<string> {
  const dasar = email.split('@')[0]

  if (!(await prisma.user.findUnique({ where: { username: dasar } }))) return dasar

  for (let i = 0; i < 20; i++) {
    const kandidat = `${dasar}_${Math.floor(Math.random() * 10000)}`

    if (!(await prisma.user.findUnique({ where: { username: kandidat } }))) return kandidat
  }

  // Sangat kecil kemungkinannya sampai sini; pakai stempel waktu sebagai jaminan.
  return `${dasar}_${Date.now().toString(36)}`
}

/**
 * Mengambil user berdasarkan email Google, atau membuatnya kalau belum ada.
 *
 * Mengikuti pola alur web: user baru dibuat tanpa password (passwordless),
 * lengkap dengan company, role Super Admin, dan menu sesuai paket bawaan.
 */
export async function cariAtauBuatUserGoogle(profil: ProfilGoogle) {
  const adaUser = await prisma.user.findUnique({ where: { email: profil.email } })

  if (adaUser) {
    // Email dari Google sudah pasti terverifikasi, jadi akun yang tadinya
    // belum terverifikasi bisa langsung diloloskan.
    if (!adaUser.verifikasi) {
      return prisma.user.update({ where: { id: adaUser.id }, data: { verifikasi: true } })
    }

    return adaUser
  }

  const sufiks = Math.random().toString(36).substring(2, 8).toUpperCase()

  const company = await prisma.company.create({
    data: {
      nama: `Company-${sufiks}`,
      status: true,
      paketId: PAKET_DEFAULT,
      paketStartDate: new Date(),
      paketEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  const role = await prisma.role.create({
    data: {
      nama: 'Super Admin',
      deskripsi: 'Administrator with full access',
      status: true,
      companyId: company.id
    }
  })

  const username = await buatUsername(profil.email)

  const user = await prisma.user.create({
    data: {
      email: profil.email,
      username,
      name: profil.nama || username,
      password: null,
      verifikasi: true,
      status: true,
      tokenVersion: 0,
      companyId: company.id,
      roleId: role.id
    }
  })

  // Kegagalan pemberian menu tidak boleh menggagalkan login — akun sudah
  // terbentuk, menunya bisa diperbaiki belakangan lewat pengaturan role.
  try {
    const paketMenus = await prisma.paketMenu.findMany({ where: { paketId: PAKET_DEFAULT } })

    if (paketMenus.length > 0) {
      await prisma.menuRole.createMany({
        data: paketMenus.map(pm => ({ roleId: role.id, menuId: pm.menuId }))
      })
    }
  } catch (error) {
    console.error('[googleAuth] Gagal memberi menu ke role baru:', error)
  }

  return user
}

/** Daftar menu milik user, bentuknya sama dengan yang dikirim /api/auth/login. */
export async function ambilMenuUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          menuRoles: {
            where: { menu: { status: true } },
            include: { menu: true },
            orderBy: { menu: { urutan: 'asc' } }
          }
        }
      }
    }
  })

  return (
    user?.role?.menuRoles.map(mr => ({
      id: mr.menu.id,
      nama: mr.menu.nama,
      path: mr.menu.path,
      icon: mr.menu.icon,
      urutan: mr.menu.urutan,
      parentId: mr.menu.parentId
    })) || []
  )
}

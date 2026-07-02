import type { FaqType } from '@/src/types/pages/faqTypes'
import FAQ from '@/src/views/pages/faq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const termData: FaqType[] = [
  {
    id: 'ketentuan-penggunaan',
    title: 'Ketentuan Penggunaan',
    icon: 'tabler-file-text',
    subtitle: 'Aturan penggunaan platform Bantu Sewa',
    questionsAnswers: [
      {
        id: 'penerimaan',
        question: 'Penerimaan Syarat',
        answer:
          'Dengan mendaftar dan menggunakan platform Bantu Sewa, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak menyetujui, harap jangan gunakan layanan kami.'
      },
      {
        id: 'perubahan',
        question: 'Perubahan Syarat',
        answer:
          'Bantu Sewa berhak mengubah, memodifikasi, atau memperbarui syarat dan ketentuan ini kapan saja tanpa pemberitahuan sebelumnya. Penggunaan Anda yang berkelanjutan atas layanan kami setelah perubahan dianggap sebagai penerimaan terhadap ketentuan yang diperbarui.'
      },
      {
        id: 'larangan',
        question: 'Larangan Penggunaan',
        answer:
          'Anda dilarang menggunakan platform untuk tujuan ilegal, menyebarkan konten berbahaya, melakukan penipuan, atau tindakan yang merugikan pengguna lain. Pelanggaran dapat mengakibatkan penangguhan atau penghapusan akun.'
      }
    ]
  },
  {
    id: 'akun',
    title: 'Akun Pengguna',
    icon: 'tabler-user-circle',
    subtitle: 'Ketentuan seputar akun dan keamanan',
    questionsAnswers: [
      {
        id: 'pendaftaran',
        question: 'Pendaftaran Akun',
        answer:
          'Untuk menggunakan fitur penuh Bantu Sewa, Anda wajib mendaftarkan akun dengan informasi yang akurat dan lengkap. Data yang diberikan harus valid dan merupakan milik Anda sendiri.'
      },
      {
        id: 'keamanan-akun',
        question: 'Keamanan Akun',
        answer:
          'Anda bertanggung jawab atas kerahasiaan kata sandi akun Anda dan semua aktivitas yang terjadi di bawah akun Anda. Segera hubungi kami jika terjadi penggunaan akun yang tidak sah.'
      },
      {
        id: 'penangguhan',
        question: 'Penangguhan Akun',
        answer:
          'Bantu Sewa berhak menangguhkan atau menghapus akun yang melanggar syarat dan ketentuan ini, terlibat dalam aktivitas penipuan, atau merugikan pengguna lain tanpa pemberitahuan terlebih dahulu.'
      }
    ]
  },
  {
    id: 'layanan',
    title: 'Layanan & Paket',
    icon: 'tabler-package',
    subtitle: 'Ketentuan layanan dan paket berlangganan',
    questionsAnswers: [
      {
        id: 'deskripsi-layanan',
        question: 'Deskripsi Layanan',
        answer:
          'Bantu Sewa menyediakan platform manajemen properti sewa berbasis berlangganan. Detail fitur dan batasan setiap paket tersedia di halaman Pricing dan dapat berubah sewaktu-waktu.'
      },
      {
        id: 'masa-berlaku',
        question: 'Masa Berlaku Paket',
        answer:
          'Masa berlaku paket dimulai sejak pembayaran berhasil dikonfirmasi. Perpanjangan tidak terjadi secara otomatis dan harus dilakukan oleh pengguna secara manual sebelum masa berlaku habis.'
      },
      {
        id: 'perubahan-harga',
        question: 'Perubahan Harga',
        answer:
          'Bantu Sewa berhak mengubah harga paket dengan pemberitahuan minimal 7 hari kerja sebelumnya. Perubahan harga tidak berlaku untuk paket yang sedang aktif hingga masa berlakunya habis.'
      }
    ]
  },
  {
    id: 'pembayaran',
    title: 'Pembayaran',
    icon: 'tabler-credit-card',
    subtitle: 'Ketentuan pembayaran dan transaksi',
    questionsAnswers: [
      {
        id: 'metode-bayar',
        question: 'Metode Pembayaran',
        answer:
          'Semua pembayaran diproses melalui gateway pembayaran iPaymu yang aman. Kami menerima berbagai metode termasuk transfer bank, virtual account, dan dompet digital.'
      },
      {
        id: 'pajak',
        question: 'Pajak dan Biaya',
        answer:
          'Harga yang tertera sudah termasuk pajak yang berlaku. Bantu Sewa tidak bertanggung jawab atas biaya tambahan yang dikenakan oleh bank atau penyedia layanan pembayaran Anda.'
      },
      {
        id: 'gagal-bayar',
        question: 'Kegagalan Pembayaran',
        answer:
          'Jika pembayaran gagal diproses, paket tidak akan aktif. Anda dapat mencoba kembali menggunakan metode pembayaran lain. Hubungi tim support jika mengalami kendala berulang.'
      }
    ]
  },
  {
    id: 'refund',
    title: 'Kebijakan Refund',
    icon: 'tabler-receipt-refund',
    subtitle: 'Syarat dan proses pengajuan refund',
    questionsAnswers: [
      {
        id: 'syarat-refund',
        question: 'Syarat Pengajuan Refund',
        answer:
          'Refund dapat diajukan dalam kondisi berikut: (1) Pembayaran berhasil diproses namun paket tidak aktif dalam 1x24 jam, (2) Terjadi double payment untuk paket yang sama, (3) Kesalahan teknis dari pihak Bantu Sewa yang menyebabkan layanan tidak berfungsi lebih dari 7 hari berturut-turut.'
      },
      {
        id: 'proses-refund',
        question: 'Proses Pengajuan Refund',
        answer:
          'Hubungi tim support melalui WhatsApp +62 856-4334-4041 atau email notif@bantusewa.com dengan menyertakan nomor invoice, bukti pembayaran, dan alasan pengajuan. Proses 3–5 hari kerja, pengembalian dana 7–14 hari kerja ke metode pembayaran asal.'
      },
      {
        id: 'tidak-bisa-refund',
        question: 'Kondisi Refund Tidak Dapat Diproses',
        answer:
          'Refund tidak dapat diproses jika: paket sudah aktif dan digunakan lebih dari 7 hari, pengajuan dilakukan setelah lebih dari 30 hari sejak tanggal pembayaran, atau terjadi pelanggaran Syarat & Ketentuan.'
      }
    ]
  },
  {
    id: 'privasi',
    title: 'Kebijakan Privasi',
    icon: 'tabler-shield-lock',
    subtitle: 'Pengelolaan dan perlindungan data pribadi',
    questionsAnswers: [
      {
        id: 'pengumpulan-data',
        question: 'Pengumpulan Data',
        answer:
          'Kami mengumpulkan data yang Anda berikan saat mendaftar dan menggunakan layanan, termasuk nama, email, nomor telepon, dan data properti. Data digunakan untuk menyediakan dan meningkatkan layanan kami.'
      },
      {
        id: 'penggunaan-data',
        question: 'Penggunaan Data',
        answer:
          'Data pribadi Anda hanya digunakan untuk: menyediakan layanan platform, memproses transaksi pembayaran, mengirimkan notifikasi penting, dan memenuhi kewajiban hukum yang berlaku.'
      },
      {
        id: 'keamanan-data',
        question: 'Keamanan Data',
        answer:
          'Kami tidak menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan oleh hukum. Semua data disimpan dengan enkripsi pada infrastruktur cloud yang aman.'
      }
    ]
  },
  {
    id: 'tanggung-jawab',
    title: 'Tanggung Jawab',
    icon: 'tabler-scale',
    subtitle: 'Batasan tanggung jawab dan hukum yang berlaku',
    questionsAnswers: [
      {
        id: 'batasan',
        question: 'Batasan Tanggung Jawab',
        answer:
          'Bantu Sewa tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan. Tanggung jawab kami terbatas pada jumlah yang Anda bayarkan dalam 12 bulan terakhir.'
      },
      {
        id: 'hukum',
        question: 'Hukum yang Berlaku',
        answer:
          'Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap sengketa diselesaikan melalui jalur hukum yang berlaku di Indonesia.'
      },
      {
        id: 'kontak-legal',
        question: 'Hubungi Kami',
        answer:
          'Jika ada pertanyaan tentang syarat dan ketentuan ini, hubungi kami: WhatsApp +62 856-4334-4041 atau email notif@bantusewa.com. Alamat: Aryana Karawaci Cluster Flora Blok E6-08, Kab. Tangerang.'
      }
    ]
  }
]

const TermConditionPage = () => {
  return (
    <div className='pli-6 md:pli-16 lg:pli-24 plb-8'>
      <FAQ data={termData} />
    </div>
  )
}

export default TermConditionPage

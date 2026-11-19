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
    title: 'Layanan',
    icon: 'tabler-gift',
    subtitle: 'Ketentuan layanan Bantu Sewa',
    questionsAnswers: [
      {
        id: 'deskripsi-layanan',
        question: 'Deskripsi Layanan',
        answer:
          'Bantu Sewa menyediakan platform manajemen bisnis sewa yang 100% gratis, tanpa biaya langganan dan tanpa paket berbayar. Seluruh fitur tersedia bagi semua pengguna dan dapat berkembang sewaktu-waktu.'
      },
      {
        id: 'biaya-layanan',
        question: 'Biaya Layanan Transaksi',
        answer:
          'Tidak ada biaya langganan. Biaya layanan per transaksi booking tetap berlaku sesuai ketentuan Bantu Sewa.'
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
          'Kami mengumpulkan data yang Anda berikan saat mendaftar dan menggunakan layanan, termasuk nama, email, nomor telepon, dan data aset sewa. Data digunakan untuk menyediakan dan meningkatkan layanan kami.'
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
          'Jika ada pertanyaan tentang syarat dan ketentuan ini, hubungi kami: WhatsApp +62 851-1054-4040 atau email support@bantusewa.com. Alamat: Aryana Karawaci Cluster Flora Blok E6-08, Kab. Tangerang.'
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

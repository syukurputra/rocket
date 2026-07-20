import type { FaqType } from '@/src/types/pages/faqTypes'
import FAQ from '@/src/views/pages/faq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const faqData: FaqType[] = [
  {
    id: 'tentang',
    title: 'Tentang Bantu Sewa',
    icon: 'tabler-info-circle',
    subtitle: 'Pertanyaan umum seputar Bantu Sewa',
    questionsAnswers: [
      {
        id: 'apa-itu',
        question: 'Apa itu Bantu Sewa?',
        answer:
          'Bantu Sewa adalah platform manajemen properti sewa yang membantu pemilik properti mengelola aset, kamar/unit, penyewa, pembayaran, dan laporan secara digital. Dengan Bantu Sewa, proses pengelolaan kos atau properti sewa menjadi lebih mudah, terorganisir, dan efisien.'
      },
      {
        id: 'daftar-properti',
        question: 'Bagaimana cara mendaftarkan properti saya di Bantu Sewa?',
        answer:
          'Setelah mendaftar akun, Anda dapat langsung menambahkan properti (aset) melalui menu Aset. Isi informasi aset seperti nama, alamat, fasilitas, dan unggah foto. Selanjutnya tambahkan unit atau kamar beserta harga sewanya. Properti Anda akan segera bisa dikelola melalui dashboard.'
      },
      {
        id: 'keamanan-data',
        question: 'Apakah data penyewa dan pembayaran aman?',
        answer:
          'Ya, keamanan data adalah prioritas kami. Semua data disimpan dengan enkripsi dan hanya dapat diakses oleh akun yang berwenang. Kami menggunakan infrastruktur cloud yang andal untuk memastikan ketersediaan dan keamanan data Anda setiap saat.'
      },
      {
        id: 'jenis-properti',
        question: 'Apakah Bantu Sewa bisa digunakan untuk berbagai jenis properti?',
        answer:
          'Ya, Bantu Sewa dirancang fleksibel untuk berbagai jenis properti sewa seperti kos, kontrakan, apartemen, ruko, dan properti komersial lainnya. Anda dapat mengatur struktur aset sesuai kebutuhan spesifik properti Anda.'
      },
      {
        id: 'kontak-support',
        question: 'Bagaimana cara menghubungi tim support Bantu Sewa?',
        answer:
          'Anda dapat menghubungi tim kami melalui WhatsApp di +62 851-1054-4040 atau email ke support@bantusewa.com. Tim kami siap membantu Anda pada hari kerja pukul 08.00–17.00 WIB.'
      }
    ]
  },
  {
    id: 'aset',
    title: 'Aset & Properti',
    icon: 'tabler-building',
    subtitle: 'Kelola aset dan properti Anda',
    questionsAnswers: [
      {
        id: 'tambah-aset',
        question: 'Bagaimana cara menambahkan aset baru?',
        answer:
          'Buka menu Aset di sidebar, lalu klik tombol "Tambah Aset". Isi informasi aset seperti nama, jenis, alamat, kota, dan provinsi. Setelah selesai klik Simpan. Aset Anda akan langsung tersedia untuk dikelola.'
      },
      {
        id: 'edit-aset',
        question: 'Bagaimana cara mengubah data aset?',
        answer:
          'Buka halaman Aset, cari aset yang ingin diubah, lalu klik ikon edit (pensil) di kolom aksi. Anda bisa mengubah semua informasi aset termasuk foto, deskripsi, dan lokasi.'
      },
      {
        id: 'foto-aset',
        question: 'Berapa banyak foto yang bisa diupload per aset?',
        answer:
          'Anda bisa mengupload beberapa foto untuk setiap aset. Format yang didukung adalah JPG, PNG, dan WebP dengan ukuran maksimal 5MB per foto.'
      },
      {
        id: 'status-aset',
        question: 'Apa artinya status aktif/nonaktif pada aset?',
        answer:
          'Aset dengan status aktif dapat dikelola dan terlihat di sistem. Aset nonaktif tidak akan muncul di halaman publik maupun pilihan saat membuat tagihan baru. Anda bisa mengubah status kapan saja.'
      },
      {
        id: 'hapus-aset',
        question: 'Apakah data tagihan ikut terhapus jika aset dihapus?',
        answer:
          'Tidak. Menghapus aset tidak akan menghapus data tagihan yang sudah dibuat. Namun aset yang sudah memiliki tagihan aktif sebaiknya dinonaktifkan saja, bukan dihapus.'
      }
    ]
  },
  {
    id: 'penyewa',
    title: 'Data Penyewa',
    icon: 'tabler-users',
    subtitle: 'Kelola data penyewa properti Anda',
    questionsAnswers: [
      {
        id: 'tambah-penyewa',
        question: 'Bagaimana cara menambahkan penyewa baru?',
        answer:
          'Buka menu Penyewa di sidebar, lalu klik "Tambah Penyewa". Isi data seperti nama, email, nomor telepon, alamat, dan nomor KTP. Data penyewa ini akan digunakan saat membuat tagihan.'
      },
      {
        id: 'cari-penyewa',
        question: 'Bagaimana cara mencari penyewa tertentu?',
        answer:
          'Di halaman Daftar Penyewa, gunakan fitur filter di bagian atas tabel. Klik tombol "Filter", masukkan nama penyewa di kolom pencarian, lalu klik "Cari". Hasil akan langsung difilter.'
      },
      {
        id: 'edit-penyewa',
        question: 'Bisakah data penyewa diubah setelah tagihan dibuat?',
        answer:
          'Ya, data penyewa bisa diubah kapan saja. Perubahan data penyewa tidak akan mempengaruhi tagihan yang sudah ada karena data tagihan tersimpan secara terpisah.'
      },
      {
        id: 'hapus-penyewa',
        question: 'Apa yang terjadi jika penyewa dihapus?',
        answer:
          'Penyewa hanya bisa dihapus jika tidak memiliki tagihan aktif. Jika masih ada tagihan terkait, sistem akan menampilkan pesan error. Pastikan semua tagihan sudah selesai sebelum menghapus data penyewa.'
      }
    ]
  },
  {
    id: 'tagihan',
    title: 'Tagihan & Pembayaran',
    icon: 'tabler-receipt',
    subtitle: 'Kelola tagihan dan konfirmasi pembayaran',
    questionsAnswers: [
      {
        id: 'buat-tagihan',
        question: 'Bagaimana cara membuat tagihan?',
        answer:
          'Buka menu Tagihan, klik "Tambah Tagihan". Pilih penyewa dan aset terkait, tentukan jumlah, jatuh tempo, dan keterangan. Setelah disimpan, Anda bisa mengirim notifikasi email ke penyewa.'
      },
      {
        id: 'kirim-email-tagihan',
        question: 'Bagaimana cara mengirim tagihan ke penyewa via email?',
        answer:
          'Di halaman detail tagihan, klik tombol "Kirim Email". Sistem akan otomatis mengirim ringkasan tagihan beserta detail pembayaran ke alamat email penyewa yang terdaftar.'
      },
      {
        id: 'konfirmasi-pembayaran',
        question: 'Bagaimana cara mengkonfirmasi pembayaran dari penyewa?',
        answer:
          'Buka menu Konfirmasi Pembayaran. Cari invoice yang ingin dikonfirmasi, klik ikon edit, lalu ubah status menjadi "PAID" dan isi tanggal bayar. Anda juga bisa upload bukti pembayaran.'
      },
      {
        id: 'status-tagihan',
        question: 'Apa saja status tagihan yang tersedia?',
        answer:
          'Tagihan memiliki beberapa status: PENDING (belum dibayar), PAID (sudah dibayar), OVERDUE (lewat jatuh tempo), dan CANCELLED (dibatalkan). Status diupdate otomatis atau bisa diubah secara manual.'
      },
      {
        id: 'bukti-bayar',
        question: 'Apakah penyewa bisa upload bukti pembayaran sendiri?',
        answer:
          'Ya, melalui halaman publik yang dapat diakses dari link di email tagihan, penyewa dapat mengupload bukti pembayaran. Admin akan mendapat notifikasi dan dapat mengkonfirmasi pembayaran tersebut.'
      }
    ]
  },
  {
    id: 'akun',
    title: 'Akun & Pengaturan',
    icon: 'tabler-settings',
    subtitle: 'Kelola akun dan pengaturan perusahaan',
    questionsAnswers: [
      {
        id: 'ubah-profil',
        question: 'Bagaimana cara mengubah profil akun saya?',
        answer:
          'Klik foto profil di pojok kanan atas, lalu pilih "Akun Saya". Di halaman profil, Anda bisa mengubah username, email, nomor telepon, alamat, dan foto profil.'
      },
      {
        id: 'ubah-password',
        question: 'Bagaimana cara mengubah password?',
        answer:
          'Buka halaman Akun Saya, scroll ke bagian Keamanan. Masukkan password lama, lalu masukkan password baru dua kali untuk konfirmasi. Klik Simpan untuk menyimpan perubahan.'
      },
      {
        id: 'kelola-user',
        question: 'Bagaimana cara mengundang anggota tim?',
        answer:
          'Buka menu User Management, klik "Undang User". Masukkan alamat email dan pilih role yang sesuai. Sistem akan mengirim email undangan. Setelah dikonfirmasi, user bisa langsung login.'
      },
      {
        id: 'role-akses',
        question: 'Apa perbedaan role yang tersedia?',
        answer:
          'Setiap role memiliki akses menu yang berbeda. Role dapat dikonfigurasi di menu Role Management — Anda bisa mengatur menu apa saja yang bisa diakses oleh setiap role sesuai kebutuhan perusahaan.'
      },
      {
        id: 'setting-company',
        question: 'Di mana saya bisa mengubah data perusahaan?',
        answer:
          'Buka menu Pengaturan > Company. Di sini Anda bisa mengubah nama perusahaan, email, nomor telepon, dan alamat kantor. Perubahan akan langsung berlaku setelah disimpan.'
      }
    ]
  },
  {
    id: 'paket',
    title: 'Paket Langganan',
    icon: 'tabler-package',
    subtitle: 'Informasi paket dan berlangganan',
    questionsAnswers: [
      {
        id: 'lihat-paket',
        question: 'Bagaimana cara melihat paket yang tersedia?',
        answer:
          'Buka menu Paket di sidebar. Anda akan melihat semua paket yang tersedia beserta fitur dan harganya. Pilih paket yang sesuai dengan kebutuhan bisnis Anda.'
      },
      {
        id: 'upgrade-paket',
        question: 'Bagaimana cara upgrade ke paket berbayar?',
        answer:
          'Di halaman Paket, pilih paket yang diinginkan dan klik "Pilih Paket". Pilih durasi (bulanan atau tahunan), lalu lanjutkan ke halaman pembayaran. Setelah pembayaran dikonfirmasi, paket langsung aktif.'
      },
      {
        id: 'trial',
        question: 'Apakah tersedia masa trial?',
        answer:
          'Ya, tersedia masa trial gratis untuk mencoba fitur premium. Selama masa trial Anda bisa mengakses semua fitur paket yang dipilih. Setelah trial berakhir, akun akan kembali ke paket gratis.'
      },
      {
        id: 'paket-expired',
        question: 'Apa yang terjadi jika paket saya expired?',
        answer:
          'Jika paket berbayar Anda expired, akun akan otomatis diturunkan ke paket gratis pada hari berikutnya. Data Anda tetap aman, namun akses ke fitur premium akan terbatas sampai Anda memperpanjang paket.'
      },
      {
        id: 'beda-paket',
        question: 'Apa perbedaan paket gratis dan berbayar?',
        answer:
          'Paket gratis memiliki batasan jumlah aset, penyewa, dan fitur yang bisa diakses. Paket berbayar memberikan akses penuh ke semua fitur termasuk laporan keuangan, booking online, pembayaran online, dan lebih banyak kuota data.'
      }
    ]
  },
  {
    id: 'pembayaran-paket',
    title: 'Pembayaran Paket',
    icon: 'tabler-credit-card',
    subtitle: 'Syarat, ketentuan, dan kebijakan pembayaran paket',
    questionsAnswers: [
      {
        id: 'syarat-refund',
        question: 'Apa saja syarat pengajuan refund?',
        answer:
          'Refund dapat diajukan dalam kondisi berikut: (1) Pembayaran berhasil diproses namun paket tidak aktif dalam 1x24 jam, (2) Terjadi double payment untuk paket yang sama, (3) Terdapat kesalahan teknis dari pihak Bantu Sewa yang menyebabkan layanan tidak berfungsi selama lebih dari 7 hari berturut-turut.'
      },
      {
        id: 'proses-refund',
        question: 'Bagaimana proses pengajuan refund?',
        answer:
          'Untuk mengajukan refund, hubungi tim support kami melalui WhatsApp +62 851-1054-4040 atau email support@bantusewa.com dengan menyertakan: nomor invoice, bukti pembayaran, dan alasan pengajuan refund. Tim kami akan memproses permintaan dalam 3–5 hari kerja dan dana akan dikembalikan ke metode pembayaran asal dalam 7–14 hari kerja.'
      },
      {
        id: 'tidak-bisa-refund',
        question: 'Kapan refund tidak bisa dilakukan?',
        answer:
          'Refund tidak dapat diproses dalam kondisi berikut: paket sudah aktif dan digunakan selama lebih dari 7 hari, pengajuan dilakukan setelah lebih dari 30 hari sejak tanggal pembayaran, atau pelanggaran Syarat & Ketentuan yang menyebabkan akun dinonaktifkan.'
      }
    ]
  }
]

const FAQPage = () => {
  return <FAQ data={faqData} />
}

export default FAQPage

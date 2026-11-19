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
          'Bantu Sewa adalah platform manajemen sewa yang membantu mengelola aset, unit/item, penyewa, pembayaran, dan laporan secara digital. Dengan Bantu Sewa, proses pengelolaan bisnis sewa menjadi lebih mudah, terorganisir, dan efisien.'
      },
      {
        id: 'daftar-aset',
        question: 'Bagaimana cara mendaftarkan aset sewa saya di Bantu Sewa?',
        answer:
          'Setelah mendaftar akun, Anda dapat langsung menambahkan aset melalui menu Aset. Isi informasi aset seperti nama, alamat, fasilitas, dan unggah foto. Selanjutnya tambahkan item aset beserta harga sewanya. Aset Anda akan segera bisa dikelola melalui dashboard, dan bisa dipublikasikan agar punya halaman sewa sendiri.'
      },
      {
        id: 'keamanan-data',
        question: 'Apakah data penyewa dan pembayaran aman?',
        answer:
          'Ya, keamanan data adalah prioritas kami. Semua data disimpan dengan enkripsi dan hanya dapat diakses oleh akun yang berwenang. Kami menggunakan infrastruktur cloud yang andal untuk memastikan ketersediaan dan keamanan data Anda setiap saat.'
      },
      {
        id: 'jenis-usaha-sewa',
        question: 'Apakah Bantu Sewa bisa digunakan untuk berbagai jenis bisnis sewa?',
        answer:
          'Ya, Bantu Sewa dirancang fleksibel untuk berbagai bisnis sewa: properti (kos, kontrakan, apartemen, ruko), kendaraan, peralatan, perlengkapan bayi, hingga perlengkapan acara. Anda dapat mengatur struktur aset dan item aset sesuai kebutuhan usaha Anda.'
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
    title: 'Aset & Item Aset',
    icon: 'tabler-building',
    subtitle: 'Kelola aset dan item sewa Anda',
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
    subtitle: 'Kelola data penyewa Anda',
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
    id: 'biaya',
    title: '100% Gratis',
    icon: 'tabler-gift',
    subtitle: 'Biaya pemakaian Bantu Sewa',
    questionsAnswers: [
      {
        id: 'apakah-gratis',
        question: 'Apakah Bantu Sewa benar-benar gratis?',
        answer:
          'Ya. Bantu Sewa 100% gratis tanpa biaya langganan dan tanpa batas masa aktif. Tidak ada lagi paket berbayar — semua usaha mendapat fitur yang sama sejak pertama mendaftar.'
      },
      {
        id: 'fitur-gratis',
        question: 'Fitur apa saja yang bisa saya pakai?',
        answer:
          'Semua fitur terbuka: kelola aset dan item sewa, booking online dan kalender, manajemen penyewa, pembayaran online, laporan keuangan, hingga halaman website usaha Anda sendiri.'
      },
      {
        id: 'biaya-layanan',
        question: 'Apakah ada biaya lain?',
        answer:
          'Tidak ada biaya langganan. Biaya layanan per transaksi booking tetap berlaku sesuai ketentuan Bantu Sewa.'
      },
      {
        id: 'paket-lama',
        question: 'Saya dulu berlangganan paket berbayar. Bagaimana sekarang?',
        answer:
          'Akun Anda otomatis mendapat semua fitur tanpa perlu memperpanjang apa pun. Untuk pertanyaan seputar pembayaran paket sebelumnya, hubungi tim support melalui WhatsApp +62 851-1054-4040 atau email support@bantusewa.com.'
      }
    ]
  }
]

const FAQPage = () => {
  return <FAQ data={faqData} />
}

export default FAQPage

// React Imports
import { useEffect, useRef } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import { useIntersection } from '@/src/hooks/useIntersection'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

type FaqsDataTypes = {
  id: string
  question: string
  active?: boolean
  answer: string
}

const FaqsData: FaqsDataTypes[] = [
  {
    id: 'panel1',
    question: 'Apa itu Bantu Sewa?',
    active: true,
    answer:
      'Bantu Sewa adalah platform manajemen sewa yang membantu mengelola aset, unit/item, penyewa, pembayaran, dan laporan secara digital. Dengan Bantu Sewa, proses pengelolaan bisnis sewa menjadi lebih mudah, terorganisir, dan efisien.'
  },
  {
    id: 'panel2',
    question: 'Bagaimana cara mendaftarkan aset sewa saya di Bantu Sewa?',
    answer:
      'Setelah mendaftar akun, Anda dapat langsung menambahkan aset melalui menu Aset. Isi informasi aset seperti nama, alamat, fasilitas, dan unggah foto. Selanjutnya tambahkan item aset beserta harga sewanya. Aset Anda akan segera bisa dikelola melalui dashboard, dan bisa dipublikasikan agar punya halaman sewa sendiri.'
  },
  {
    id: 'panel3',
    question: 'Apakah data penyewa dan pembayaran aman?',
    answer:
      'Ya, keamanan data adalah prioritas kami. Semua data disimpan dengan enkripsi dan hanya dapat diakses oleh akun yang berwenang. Kami menggunakan infrastruktur cloud yang andal untuk memastikan ketersediaan dan keamanan data Anda setiap saat.'
  },
  {
    id: 'panel4',
    question: 'Apakah Bantu Sewa bisa digunakan untuk berbagai jenis bisnis sewa?',
    answer:
      'Ya, Bantu Sewa dirancang fleksibel untuk berbagai bisnis sewa: properti (kos, kontrakan, apartemen, ruko), kendaraan, peralatan, perlengkapan bayi, hingga perlengkapan acara. Anda dapat mengatur struktur aset dan item aset sesuai kebutuhan usaha Anda.'
  },
  {
    id: 'panel5',
    question: 'Bagaimana cara menghubungi tim support Bantu Sewa?',
    answer:
      'Anda dapat menghubungi tim kami melalui WhatsApp di +62 851-1054-4040 atau email ke support@bantusewa.com. Tim kami siap membantu Anda pada hari kerja pukul 08.00–17.00 WIB.'
  },
  {
    id: 'panel6',
    question: 'Apa saja syarat pengajuan refund?',
    answer:
      'Refund dapat diajukan dalam kondisi berikut: (1) Pembayaran berhasil diproses namun paket tidak aktif dalam 1x24 jam, (2) Terjadi double payment untuk paket yang sama, (3) Terdapat kesalahan teknis dari pihak Bantu Sewa yang menyebabkan layanan tidak berfungsi selama lebih dari 7 hari berturut-turut.'
  },
  {
    id: 'panel7',
    question: 'Bagaimana proses pengajuan refund?',
    answer:
      'Untuk mengajukan refund, hubungi tim support kami melalui WhatsApp +62 851-1054-4040 atau email support@bantusewa.com dengan menyertakan: nomor invoice, bukti pembayaran, dan alasan pengajuan refund. Tim kami akan memproses permintaan dalam 3–5 hari kerja dan dana akan dikembalikan ke metode pembayaran asal dalam 7–14 hari kerja.'
  },
  {
    id: 'panel8',
    question: 'Kapan refund tidak bisa dilakukan?',
    answer:
      'Refund tidak dapat diproses dalam kondisi berikut: paket sudah aktif dan digunakan selama lebih dari 7 hari, pengajuan dilakukan setelah lebih dari 30 hari sejak tanggal pembayaran, atau pelanggaran Syarat & Ketentuan yang menyebabkan akun dinonaktifkan.'
  }
]

const Faqs = () => {
  // Refs
  const skipIntersection = useRef(true)
  const ref = useRef<null | HTMLDivElement>(null)

  // Hooks
  const { updateIntersections } = useIntersection()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (skipIntersection.current) {
          skipIntersection.current = false

          return
        }

        updateIntersections({ [entry.target.id]: entry.isIntersecting })
      },
      { threshold: 0.35 }
    )

    ref.current && observer.observe(ref.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id='faq' ref={ref} className='plb-[100px] bg-backgroundDefault'>
      <div className={classnames('flex flex-col gap-16', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip size='small' variant='tonal' color='primary' label='FAQ' />
          <div className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
            <div className='flex items-center gap-x-2'>
              <Typography color='text.primary' variant='h4'>
                Pertanyaan yang Sering
                <span className='relative z-[1] font-extrabold'>
                  <img
                    src='/images/front-pages/landing-page/bg-shape.png'
                    alt='' aria-hidden='true'
                    className='absolute block-end-0 z-[1] bs-[40%] is-[132%] -inline-start-[8%] block-start-[17px]'
                  />{' '}
                  Diajukan
                </span>
              </Typography>
            </div>
            <Typography className='text-center'>
              Semua hal yang perlu Anda ketahui tentang Bantu Sewa dan bagaimana cara menggunakannya
            </Typography>
          </div>
        </div>
        <div>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, lg: 5 }} className='text-center'>
              <img
                src='/images/front-pages/landing-page/image-faq.png'
                alt='boy with laptop'
                className='is-[80%] max-is-[320px]'
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 7 }}>
              <div>
                {FaqsData.map((data, index) => {
                  return (
                    <Accordion key={index} defaultExpanded={data.active}>
                      <AccordionSummary
                        aria-controls={data.id + '-content'}
                        id={data.id + '-header'}
                        className='font-medium'
                        color='text.primary'
                      >
                        {data.question}
                      </AccordionSummary>
                      <AccordionDetails className='text-textSecondary'>{data.answer}</AccordionDetails>
                    </Accordion>
                  )
                })}
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    </section>
  )
}

export default Faqs

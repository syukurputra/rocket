/**
 * Verification script to test paket date functionality
 * Run with: npx tsx scripts/verify-paket-dates.ts
 */

import { PrismaClient } from '@prisma/client'
import { isPaketExpired, getDaysRemaining, formatPaketPeriod } from '../src/utils/paketUtils'

const prisma = new PrismaClient()

async function verifyPaketDates() {
  console.log('🔍 Verifying Paket Date Implementation\n')

  try {
    // 1. Check if fields exist in database
    console.log('1️⃣ Checking database schema...')
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        nama: true,
        paketStartDate: true,
        paketEndDate: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`   ✅ Found ${companies.length} companies`)
    console.log(`   ✅ Fields paketStartDate and paketEndDate exist\n`)

    // 2. Display company paket dates
    console.log('2️⃣ Company Paket Dates:\n')
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.nama}`)
      console.log(`      Start: ${company.paketStartDate || 'Not set'}`)
      console.log(`      End:   ${company.paketEndDate || 'Not set'}`)

      if (company.paketEndDate) {
        const daysRemaining = getDaysRemaining(company.paketEndDate)
        const isExpired = isPaketExpired(company.paketEndDate)
        const period = formatPaketPeriod(company.paketStartDate, company.paketEndDate)

        console.log(`      Period: ${period}`)
        console.log(`      Days Remaining: ${daysRemaining}`)
        console.log(`      Status: ${isExpired ? '❌ EXPIRED' : '✅ ACTIVE'}`)
      }
      console.log('')
    })

    // 3. Test utility functions
    console.log('3️⃣ Testing Utility Functions:\n')

    const testDate = new Date()
    const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // +15 days
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // -5 days

    console.log(`   Test 1: isPaketExpired(future date)`)
    console.log(`   Result: ${isPaketExpired(futureDate)} (expected: false)\n`)

    console.log(`   Test 2: isPaketExpired(past date)`)
    console.log(`   Result: ${isPaketExpired(pastDate)} (expected: true)\n`)

    console.log(`   Test 3: getDaysRemaining(future date)`)
    console.log(`   Result: ${getDaysRemaining(futureDate)} days (expected: ~15)\n`)

    console.log(`   Test 4: formatPaketPeriod`)
    console.log(`   Result: ${formatPaketPeriod(testDate, futureDate)}\n`)

    // 4. Summary
    console.log('📊 Summary:')
    const companiesWithDates = companies.filter(c => c.paketStartDate && c.paketEndDate).length
    const companiesWithoutDates = companies.length - companiesWithDates

    console.log(`   Total companies checked: ${companies.length}`)
    console.log(`   With paket dates: ${companiesWithDates}`)
    console.log(`   Without paket dates: ${companiesWithoutDates}`)

    if (companiesWithDates > 0) {
      console.log('\n✅ Paket date implementation is working correctly!')
    } else {
      console.log('\n⚠️  No companies have paket dates set yet.')
      console.log('   Register a new user to test automatic date assignment.')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifyPaketDates()

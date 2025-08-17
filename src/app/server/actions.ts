/**
 * ! The server actions below are used to fetch the static data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 */

'use server'

// Data Imports
import { db as asetData } from '@/src/fake-db/apps/aset'

export const getAsetData = async () => {
  return asetData
}
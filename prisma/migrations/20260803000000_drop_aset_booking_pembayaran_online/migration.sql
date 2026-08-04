-- Hapus kolom aset."bookingOnline" dan aset."pembayaranOnline".
--
-- Keduanya hanya pernah ditulis (create/update aset) dan tidak pernah dibaca
-- oleh logika mana pun, sehingga tidak ada perilaku yang berubah.

ALTER TABLE "aset" DROP COLUMN IF EXISTS "bookingOnline";
ALTER TABLE "aset" DROP COLUMN IF EXISTS "pembayaranOnline";

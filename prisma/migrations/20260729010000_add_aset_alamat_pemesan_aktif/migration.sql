-- aset."alamatPemesanAktif" — kalau aktif, pemesan wajib melengkapi alamat
-- profilnya sebelum bisa membayar booking pada aset tersebut.

ALTER TABLE "aset" ADD COLUMN IF NOT EXISTS "alamatPemesanAktif" BOOLEAN NOT NULL DEFAULT false;

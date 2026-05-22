-- Insert Konfirmasi Pembayaran menu under Management parent
-- First find Management parent ID
DO $$
DECLARE
  v_management_id TEXT;
  v_menu_id TEXT := 'menu-konfirmasi-pembayaran';
BEGIN
  -- Get Management menu ID
  SELECT id INTO v_management_id FROM "menu" WHERE "nama" = 'Management' AND "parentId" IS NULL LIMIT 1;

  IF v_management_id IS NULL THEN
    RAISE NOTICE 'Management menu not found';
    RETURN;
  END IF;

  -- Insert Konfirmasi Pembayaran menu if not exists
  INSERT INTO "menu" ("id", "nama", "keterangan", "path", "icon", "urutan", "parentId", "status", "createdAt", "updatedAt")
  VALUES (
    v_menu_id,
    'Konfirmasi Pembayaran',
    'Kelola konfirmasi pembayaran invoice',
    '/management-master/konfirmasi-pembayaran',
    'tabler-credit-card',
    99,
    v_management_id,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT ("id") DO NOTHING;

  -- Assign to all existing pakets
  INSERT INTO "paket_menu" ("id", "paketId", "menuId", "createdAt", "updatedAt")
  SELECT
    'pm-konfirmasi-' || mp.id,
    mp.id,
    v_menu_id,
    NOW(),
    NOW()
  FROM "m_paket" mp
  ON CONFLICT ("paketId", "menuId") DO NOTHING;

  -- Assign to all existing roles
  INSERT INTO "menu_role" ("id", "roleId", "menuId", "createdAt", "updatedAt")
  SELECT
    'rm-konfirmasi-' || r.id,
    r.id,
    v_menu_id,
    NOW(),
    NOW()
  FROM "role" r
  ON CONFLICT ("roleId", "menuId") DO NOTHING;

  RAISE NOTICE 'Konfirmasi Pembayaran menu seeded successfully';
END $$;

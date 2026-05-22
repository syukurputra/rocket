-- Add Invoice menu under Setting
INSERT INTO "menu" ("id", "nama", "path", "icon", "urutan", "parentId", "status", "createdAt", "updatedAt")
VALUES (
  'menu-setting-invoice',
  'Invoice',
  '/setting/invoice',
  'tabler-file-invoice',
  3,
  'menu-setting',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- Assign invoice menu to all existing paket_menu entries (so all packages get access)
INSERT INTO "paket_menu" ("id", "paketId", "menuId", "createdAt", "updatedAt")
SELECT
  'pm-invoice-' || mp.id,
  mp.id,
  'menu-setting-invoice',
  NOW(),
  NOW()
FROM "m_paket" mp
ON CONFLICT ("paketId", "menuId") DO NOTHING;

-- Assign invoice menu to Super Admin role
INSERT INTO "menu_role" ("id", "roleId", "menuId", "createdAt", "updatedAt")
VALUES (
  'rm-menu-setting-invoice',
  'superadmin-role-001',
  'menu-setting-invoice',
  NOW(),
  NOW()
)
ON CONFLICT ("roleId", "menuId") DO NOTHING;

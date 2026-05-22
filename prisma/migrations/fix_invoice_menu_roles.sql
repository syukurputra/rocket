-- Assign menu-setting-invoice to ALL existing roles that don't have it yet
INSERT INTO "menu_role" ("id", "roleId", "menuId", "createdAt", "updatedAt")
SELECT
  'rm-invoice-' || r.id,
  r.id,
  'menu-setting-invoice',
  NOW(),
  NOW()
FROM "role" r
WHERE NOT EXISTS (
  SELECT 1 FROM "menu_role" mr
  WHERE mr."roleId" = r.id AND mr."menuId" = 'menu-setting-invoice'
)
ON CONFLICT ("roleId", "menuId") DO NOTHING;

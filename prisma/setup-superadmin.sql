-- Create Super Admin Role (global, no company)
INSERT INTO "role" ("id", "nama", "deskripsi", "status", "companyId", "createdAt", "updatedAt")
VALUES (
  'superadmin-role-001',
  'Super Admin',
  'Full system access with all permissions',
  true,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Create default global menus
INSERT INTO "menu" ("id", "nama", "path", "icon", "urutan", "parentId", "status", "companyId", "createdAt", "updatedAt")
VALUES
  ('menu-home', 'Home', '/home', 'tabler-smart-home', 1, NULL, true, NULL, NOW(), NOW()),
  ('menu-aset', 'Aset', '/aset/list', 'tabler-home-dollar', 2, NULL, true, NULL, NOW(), NOW()),
  ('menu-keuangan', 'Keuangan', '/keuangan/list', 'tabler-chart-histogram', 3, NULL, true, NULL, NOW(), NOW()),
  ('menu-penghuni', 'Penghuni', '/penghuni/list', 'tabler-friends', 4, NULL, true, NULL, NOW(), NOW()),
  ('menu-company', 'Company Management', '/management-master/company', 'tabler-building', 5, NULL, true, NULL, NOW(), NOW()),
  ('menu-user', 'User Management', '/management-master/user', 'tabler-users', 6, NULL, true, NULL, NOW(), NOW()),
  ('menu-role', 'Role Management', '/management-master/role', 'tabler-shield', 7, NULL, true, NULL, NOW(), NOW()),
  ('menu-menu', 'Menu Management', '/management-master/menu', 'tabler-menu-2', 8, NULL, true, NULL, NOW(), NOW()),
  ('menu-kategori', 'Kategori Keuangan', '/master/icon/list', 'tabler-favicon', 9, NULL, true, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Assign all menus to Super Admin role with full permissions
INSERT INTO "role_menu" ("id", "roleId", "menuId", "canCreate", "canRead", "canUpdate", "canDelete", "createdAt", "updatedAt")
SELECT
  'rm-' || m.id,
  'superadmin-role-001',
  m.id,
  true,
  true,
  true,
  true,
  NOW(),
  NOW()
FROM "menu" m
WHERE m."companyId" IS NULL
ON CONFLICT ("roleId", "menuId") DO NOTHING;

-- Update user syukur.putra@gmail.com to Super Admin role
UPDATE "user"
SET "roleId" = 'superadmin-role-001',
    "updatedAt" = NOW()
WHERE "email" = 'syukur.putra@gmail.com';

-- Verify the setup
SELECT
  u."email",
  u."username",
  u."isSuperAdmin",
  r."nama" as "roleName",
  COUNT(rm."id") as "menuCount"
FROM "user" u
LEFT JOIN "role" r ON u."roleId" = r."id"
LEFT JOIN "role_menu" rm ON r."id" = rm."roleId"
WHERE u."email" = 'syukur.putra@gmail.com'
GROUP BY u."email", u."username", u."isSuperAdmin", r."nama";

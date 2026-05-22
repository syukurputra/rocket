INSERT INTO "menu_role" ("id", "roleId", "menuId", "createdAt", "updatedAt")
SELECT 'rm-konfirmasi-superadmin', 'superadmin-role-001', m.id, NOW(), NOW()
FROM "menu" m
WHERE m."path" = '/management-master/konfirmasi-pembayaran'
ON CONFLICT ("roleId", "menuId") DO NOTHING;

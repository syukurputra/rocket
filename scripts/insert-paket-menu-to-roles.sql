-- Script to insert menu 'menu-paket-pilihan' to all existing roles
-- This will add the Paket Pricing menu to every role in the system

-- Insert menu_role records for all existing roles
INSERT INTO menu_role (id, "roleId", "menuId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text AS id,
    r.id AS "roleId",
    'menu-paket-pilihan' AS "menuId",
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
FROM role r
WHERE NOT EXISTS (
    -- Avoid duplicates: only insert if this role doesn't already have this menu
    SELECT 1
    FROM menu_role mr
    WHERE mr."roleId" = r.id
    AND mr."menuId" = 'menu-paket-pilihan'
);

-- Verify the insertions
SELECT
    r.nama AS role_name,
    m.nama AS menu_name,
    mr."createdAt"
FROM menu_role mr
JOIN role r ON mr."roleId" = r.id
JOIN menu m ON mr."menuId" = m.id
WHERE mr."menuId" = 'menu-paket-pilihan'
ORDER BY r.nama;

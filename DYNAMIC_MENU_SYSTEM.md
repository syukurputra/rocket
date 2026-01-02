# Dynamic Menu System - Implementation Complete! ✅

## 🎉 Sistem Menu Dinamis Berhasil Diimplementasikan!

User sekarang akan melihat menu yang berbeda berdasarkan role mereka.

## 🔄 Cara Kerja Sistem

### 1. Login Flow

```
User Login → API Check Role → Fetch Menus from RoleMenu → Return Menus → Save to localStorage → Render Dynamic Sidebar
```

### 2. Relasi Database

- **User → Role**: One-to-Many (satu user punya satu role)
- **Role → Menu**: Many-to-Many via RoleMenu (satu role bisa punya banyak menu)
- **RoleMenu**: Menyimpan permissions (canCreate, canRead, canUpdate, canDelete)

## 📝 Perubahan yang Dilakukan

### 1. Login API (`/api/auth/login`)

**File:** `src/app/api/auth/login/route.ts`

**Response Baru:**

```json
{
  "message": "Login berhasil",
  "user": {
    "id": "user-id",
    "username": "syukur.putra",
    "email": "syukur.putra@gmail.com",
    "isSuperAdmin": true,
    "company": {
      "id": "company-id",
      "nama": "Company Name"
    },
    "role": {
      "id": "role-id",
      "nama": "Super Admin",
      "deskripsi": "Full system access"
    }
  },
  "menus": [
    {
      "id": "menu-home",
      "nama": "Home",
      "path": "/home",
      "icon": "tabler-smart-home",
      "urutan": 1,
      "parentId": null,
      "permissions": {
        "canCreate": true,
        "canRead": true,
        "canUpdate": true,
        "canDelete": true
      }
    }
    // ... more menus
  ],
  "accessToken": "...",
  "refreshToken": "..."
}
```

### 2. Dynamic Sidebar Component

**File:** `src/components/layout/vertical/VerticalMenu.tsx`

**Fitur:**

- ✅ Membaca menus dari `localStorage.getItem('userMenus')`
- ✅ Render menu dinamis berdasarkan data user
- ✅ Filter menu berdasarkan `canRead` permission
- ✅ Fallback ke default menu jika tidak ada data
- ✅ Auto-update saat login/logout

### 3. Login Page Update

**File:** `src/views/apps/login/Login.tsx`

**Perubahan:**

```typescript
// Menyimpan menus ke localStorage
if (data.menus && Array.isArray(data.menus)) {
  localStorage.setItem('userMenus', JSON.stringify(data.menus))
}
```

## 🧪 Cara Testing

### Test 1: Login sebagai Super Admin

1. Login dengan:

   - Email: `syukur.putra@gmail.com`
   - Password: `12345678`

2. Setelah login, buka Developer Tools (F12)

3. Check localStorage:

   ```javascript
   localStorage.getItem('userMenus')
   ```

4. Harusnya melihat 9 menus:

   - Home
   - Aset
   - Keuangan
   - Penghuni
   - Company Management
   - User Management
   - Role Management
   - Menu Management
   - Kategori Keuangan

5. Sidebar seharusnya menampilkan semua 9 menu

### Test 2: Create Role Baru dengan Limited Access

1. Login sebagai super admin
2. Buat role baru (misal: "Staff")
3. Assign hanya beberapa menu (misal: Home, Aset, Keuangan)
4. Buat user baru dengan role "Staff"
5. Logout dan login dengan user baru
6. Sidebar seharusnya hanya menampilkan 3 menu yang di-assign

### Test 3: Permissions

1. Menu hanya muncul jika `canRead: true`
2. Jika `canRead: false`, menu tidak akan muncul di sidebar

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Login     │
│   Page      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  POST       │
│  /api/auth/ │
│  login      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Prisma     │
│  Query:     │
│  - User     │
│  - Role     │
│  - RoleMenu │
│  - Menu     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Format     │
│  Response:  │
│  - user     │
│  - role     │
│  - menus[]  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Save to    │
│  localStorage│
│  - userMenus│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Redirect   │
│  to /home   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Sidebar    │
│  Reads      │
│  localStorage│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Render     │
│  Dynamic    │
│  Menu Items │
└─────────────┘
```

## 🎯 Menu Structure

### localStorage Format

```json
[
  {
    "id": "menu-home",
    "nama": "Home",
    "path": "/home",
    "icon": "tabler-smart-home",
    "urutan": 1,
    "parentId": null,
    "permissions": {
      "canCreate": true,
      "canRead": true,
      "canUpdate": true,
      "canDelete": true
    }
  }
]
```

### Sidebar Rendering Logic

```typescript
// Filter menus with read permission
userMenus
  .filter(menu => menu.permissions.canRead)
  .map(menu => (
    <MenuItem
      key={menu.id}
      href={`/id${menu.path}`}
      icon={<i className={menu.icon} />}
    >
      {menu.nama}
    </MenuItem>
  ))
```

## ✅ Checklist

- [x] Update login API to return menus
- [x] Create dynamic sidebar component
- [x] Update login page to save menus
- [x] Filter menus by canRead permission
- [x] Fallback to default menus
- [x] Auto-refresh on login

## 🚀 Next Steps (Optional)

### 1. Hierarchical Menus (Parent-Child)

Implement submenu support using `parentId`:

```typescript
const buildMenuTree = menus => {
  const menuMap = {}
  const roots = []

  menus.forEach(menu => {
    menuMap[menu.id] = { ...menu, children: [] }
  })

  menus.forEach(menu => {
    if (menu.parentId) {
      menuMap[menu.parentId].children.push(menuMap[menu.id])
    } else {
      roots.push(menuMap[menu.id])
    }
  })

  return roots
}
```

### 2. Permission-Based UI Elements

Hide/show buttons based on permissions:

```typescript
const { canCreate, canUpdate, canDelete } = menu.permissions

{canCreate && <Button>Add New</Button>}
{canUpdate && <IconButton>Edit</IconButton>}
{canDelete && <IconButton>Delete</IconButton>}
```

### 3. Real-time Menu Updates

Implement WebSocket or polling to update menus when role changes

## 🎉 Summary

✅ **Login API**: Returns user + role + menus  
✅ **Dynamic Sidebar**: Renders menus from localStorage  
✅ **Permission Filter**: Only shows menus with canRead  
✅ **Auto-save**: Menus saved on login  
✅ **Fallback**: Default menus if no data

**Status:** Fully functional! Login dan test menu dinamis sekarang! 🚀

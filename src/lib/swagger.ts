import type { OpenAPIV3 } from 'openapi-types'

const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Bantu Sewa API',
    version: '1.0.0',
    description: 'Dokumentasi API untuk aplikasi Bantu Sewa'
  },
  servers: [
    {
      url: '/api',
      description: 'API Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token dari response login'
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'Cookie yang di-set otomatis setelah login'
      }
    },
    schemas: {
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalCount: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 10 },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Terjadi kesalahan server' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string' },
          verifikasi: { type: 'boolean' },
          companyId: { type: 'string', nullable: true },
          roleId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          company: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              nama: { type: 'string' }
            }
          },
          role: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              nama: { type: 'string' }
            }
          }
        }
      },
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nama: { type: 'string' },
          email: { type: 'string', nullable: true },
          telepon: { type: 'string', nullable: true },
          alamat: { type: 'string', nullable: true },
          paketId: { type: 'string', nullable: true },
          paketEndDate: { type: 'string', format: 'date-time', nullable: true },
          isTrial: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Aset: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          jenis: { type: 'string' },
          nama: { type: 'string' },
          deskripsi: { type: 'string', nullable: true },
          alamat: { type: 'string' },
          kota: { type: 'string' },
          provinsi: { type: 'string' },
          kecamatan: { type: 'string', nullable: true },
          kelurahan: { type: 'string', nullable: true },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
          status: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Penyewa: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nama: { type: 'string' },
          email: { type: 'string', nullable: true },
          telepon: { type: 'string', nullable: true },
          alamat: { type: 'string', nullable: true },
          ktpNumber: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Tagihan: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nomorTagihan: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'PAID', 'CANCELLED', 'OVERDUE'] },
          totalAmount: { type: 'number' },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nomorInvoice: { type: 'string' },
          status: { type: 'string' },
          tanggalInvoice: { type: 'string', format: 'date-time', nullable: true },
          tanggalBayar: { type: 'string', format: 'date-time', nullable: true },
          totalAmount: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Role: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nama: { type: 'string' },
          deskripsi: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Menu: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nama: { type: 'string' },
          path: { type: 'string', nullable: true },
          icon: { type: 'string', nullable: true },
          urutan: { type: 'integer' },
          parentId: { type: 'string', nullable: true },
          status: { type: 'boolean' },
          keterangan: { type: 'string', nullable: true }
        }
      },
      Paket: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nama: { type: 'string' },
          deskripsi: { type: 'string', nullable: true },
          hargaBulanan: { type: 'number' },
          hargaTahunan: { type: 'number' },
          status: { type: 'boolean' }
        }
      },
      Icon: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nama: { type: 'string' },
          code: { type: 'string' },
          status: { type: 'boolean' }
        }
      },
      JenisAset: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nama: { type: 'string' },
          keterangan: { type: 'string', nullable: true },
          status: { type: 'boolean' }
        }
      }
    }
  },
  security: [{ BearerAuth: [] }, { CookieAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Autentikasi dan manajemen sesi' },
    { name: 'User', description: 'Manajemen pengguna' },
    { name: 'Company', description: 'Manajemen perusahaan' },
    { name: 'Aset', description: 'Manajemen aset sewa' },
    { name: 'Aset Item', description: 'Manajemen item/unit dalam aset' },
    { name: 'Penyewa', description: 'Manajemen data penyewa' },
    { name: 'Tagihan', description: 'Manajemen tagihan' },
    { name: 'Invoice', description: 'Manajemen invoice pembayaran' },
    { name: 'Keuangan', description: 'Laporan keuangan' },
    { name: 'Role', description: 'Manajemen role / hak akses' },
    { name: 'Menu', description: 'Manajemen menu aplikasi' },
    { name: 'Master Wilayah', description: 'Data wilayah Indonesia (provinsi, kota, kecamatan, kelurahan)' },
    { name: 'Master Paket', description: 'Manajemen paket layanan' },
    { name: 'Master Jenis Aset', description: 'Manajemen jenis aset' },
    { name: 'Master Icon', description: 'Manajemen icon' },
    { name: 'Admin', description: 'Endpoint admin (SUPER ADMIN only)' },
    { name: 'Upload', description: 'Upload file' },
    { name: 'Notifikasi', description: 'Notifikasi pengguna' },
    { name: 'Setting', description: 'Pengaturan aplikasi' },
    { name: 'Dashboard', description: 'Statistik dashboard' },
    { name: 'Public', description: 'Endpoint publik tanpa autentikasi' }
  ],
  paths: {
    // ─── AUTH ──────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin@example.com', description: 'Email atau username' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login berhasil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Login berhasil' },
                    user: { $ref: '#/components/schemas/User' },
                    menus: { type: 'array', items: { $ref: '#/components/schemas/Menu' } },
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': { description: 'Username / password salah' }
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        responses: {
          '200': { description: 'Logout berhasil' }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrasi akun baru',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Registrasi berhasil, cek email verifikasi' },
          '400': { description: 'Validasi gagal atau email sudah terdaftar' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Ambil data user yang sedang login',
        responses: {
          '200': {
            description: 'Data user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '401': { description: 'Tidak terautentikasi' }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        security: [],
        responses: {
          '200': { description: 'Token baru berhasil dibuat' },
          '401': { description: 'Refresh token tidak valid' }
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Kirim email reset password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Email reset password berhasil dikirim' },
          '404': { description: 'Email tidak ditemukan' }
        }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password dengan token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Password berhasil direset' },
          '400': { description: 'Token tidak valid atau expired' }
        }
      }
    },
    '/auth/verifikasi': {
      post: {
        tags: ['Auth'],
        summary: 'Verifikasi email dengan token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Email berhasil diverifikasi' },
          '400': { description: 'Token tidak valid' }
        }
      }
    },
    '/auth/check': {
      get: {
        tags: ['Auth'],
        summary: 'Cek status autentikasi',
        responses: {
          '200': { description: 'Terautentikasi' },
          '401': { description: 'Tidak terautentikasi' }
        }
      }
    },
    // ─── USER ──────────────────────────────────────────────────
    '/user': {
      get: {
        tags: ['User'],
        summary: 'List user dalam company',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'List user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['User'],
        summary: 'Buat user baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  roleId: { type: 'string' },
                  verifikasi: { type: 'boolean', default: false }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'User berhasil dibuat' },
          '400': { description: 'Validasi gagal' }
        }
      }
    },
    '/user/{id}': {
      get: {
        tags: ['User'],
        summary: 'Ambil detail user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detail user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '404': { description: 'User tidak ditemukan' }
        }
      },
      put: {
        tags: ['User'],
        summary: 'Update user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string' },
                  roleId: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'User berhasil diupdate' },
          '404': { description: 'User tidak ditemukan' }
        }
      },
      delete: {
        tags: ['User'],
        summary: 'Hapus user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'User berhasil dihapus' },
          '404': { description: 'User tidak ditemukan' }
        }
      }
    },
    '/user/invite': {
      post: {
        tags: ['User'],
        summary: 'Undang user via email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  roleId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Undangan berhasil dikirim' },
          '400': { description: 'Email sudah terdaftar' }
        }
      }
    },
    '/user/profile': {
      put: {
        tags: ['User'],
        summary: 'Update profil user yang sedang login',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string' },
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Profil berhasil diupdate' }
        }
      }
    },
    // ─── COMPANY ──────────────────────────────────────────────────
    '/company': {
      get: {
        tags: ['Company'],
        summary: 'List company',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'List company',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Company' } },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Company'],
        summary: 'Buat company baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama'],
                properties: {
                  nama: { type: 'string' },
                  email: { type: 'string' },
                  telepon: { type: 'string' },
                  alamat: { type: 'string' },
                  paketId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Company berhasil dibuat' },
          '400': { description: 'Validasi gagal' }
        }
      }
    },
    '/company/{id}': {
      get: {
        tags: ['Company'],
        summary: 'Detail company',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detail company', content: { 'application/json': { schema: { $ref: '#/components/schemas/Company' } } } },
          '404': { description: 'Company tidak ditemukan' }
        }
      },
      put: {
        tags: ['Company'],
        summary: 'Update company',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nama: { type: 'string' },
                  email: { type: 'string' },
                  telepon: { type: 'string' },
                  alamat: { type: 'string' },
                  paketId: { type: 'string' },
                  paketEndDate: { type: 'string', format: 'date-time' },
                  isTrial: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Company berhasil diupdate' }
        }
      },
      delete: {
        tags: ['Company'],
        summary: 'Hapus company',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Company berhasil dihapus' }
        }
      }
    },
    // ─── ASET ──────────────────────────────────────────────────
    '/aset': {
      get: {
        tags: ['Aset'],
        summary: 'List aset milik user/company',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          '200': {
            description: 'List aset',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Aset' } },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Aset'],
        summary: 'Tambah aset baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jenis', 'nama', 'alamat', 'kota', 'provinsi'],
                properties: {
                  jenis: { type: 'string' },
                  nama: { type: 'string' },
                  deskripsi: { type: 'string' },
                  alamat: { type: 'string' },
                  kota: { type: 'string' },
                  provinsi: { type: 'string' },
                  kecamatan: { type: 'string' },
                  kelurahan: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  status: { type: 'boolean', default: true }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Aset berhasil ditambahkan' },
          '400': { description: 'Validasi gagal' }
        }
      }
    },
    '/aset/{id}': {
      get: {
        tags: ['Aset'],
        summary: 'Detail aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detail aset', content: { 'application/json': { schema: { $ref: '#/components/schemas/Aset' } } } },
          '404': { description: 'Aset tidak ditemukan' }
        }
      },
      put: {
        tags: ['Aset'],
        summary: 'Update aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Aset' }
            }
          }
        },
        responses: {
          '200': { description: 'Aset berhasil diupdate' }
        }
      },
      delete: {
        tags: ['Aset'],
        summary: 'Hapus aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Aset berhasil dihapus' }
        }
      }
    },
    '/aset/summary': {
      get: {
        tags: ['Aset'],
        summary: 'Ringkasan statistik aset',
        responses: {
          '200': { description: 'Statistik aset' }
        }
      }
    },
    '/aset/dp': {
      get: {
        tags: ['Aset'],
        summary: 'Dropdown list aset (id + nama)',
        responses: {
          '200': { description: 'List aset untuk dropdown' }
        }
      }
    },
    '/aset/{id}/images': {
      get: {
        tags: ['Aset'],
        summary: 'List gambar aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'List gambar' } }
      },
      post: {
        tags: ['Aset'],
        summary: 'Upload gambar aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } }
              }
            }
          }
        },
        responses: { '201': { description: 'Gambar berhasil diupload' } }
      }
    },
    // ─── ASET ITEM ──────────────────────────────────────────────────
    '/aset-item': {
      get: {
        tags: ['Aset Item'],
        summary: 'List item aset',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'asetId', in: 'query', schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'List item aset' } }
      },
      post: {
        tags: ['Aset Item'],
        summary: 'Tambah item aset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama', 'asetId'],
                properties: {
                  nama: { type: 'string' },
                  asetId: { type: 'string' },
                  deskripsi: { type: 'string' },
                  status: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Item berhasil ditambahkan' } }
      }
    },
    '/aset-item/{id}': {
      get: {
        tags: ['Aset Item'],
        summary: 'Detail item aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detail item' } }
      },
      put: {
        tags: ['Aset Item'],
        summary: 'Update item aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Item berhasil diupdate' } }
      },
      delete: {
        tags: ['Aset Item'],
        summary: 'Hapus item aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Item berhasil dihapus' } }
      }
    },
    // ─── PENYEWA ──────────────────────────────────────────────────
    '/penyewa': {
      get: {
        tags: ['Penyewa'],
        summary: 'List penyewa',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'List penyewa',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Penyewa' } },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Penyewa'],
        summary: 'Tambah penyewa baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama'],
                properties: {
                  nama: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  telepon: { type: 'string' },
                  alamat: { type: 'string' },
                  ktpNumber: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Penyewa berhasil ditambahkan' } }
      }
    },
    '/penyewa/{id}': {
      get: {
        tags: ['Penyewa'],
        summary: 'Detail penyewa',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detail penyewa', content: { 'application/json': { schema: { $ref: '#/components/schemas/Penyewa' } } } } }
      },
      put: {
        tags: ['Penyewa'],
        summary: 'Update penyewa',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Penyewa' } } } },
        responses: { '200': { description: 'Penyewa berhasil diupdate' } }
      },
      delete: {
        tags: ['Penyewa'],
        summary: 'Hapus penyewa',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Penyewa berhasil dihapus' } }
      }
    },
    '/penyewa/stats': {
      get: {
        tags: ['Penyewa'],
        summary: 'Statistik penyewa',
        responses: { '200': { description: 'Statistik penyewa' } }
      }
    },
    // ─── TAGIHAN ──────────────────────────────────────────────────
    '/tagihan': {
      get: {
        tags: ['Tagihan'],
        summary: 'List tagihan',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'List tagihan' } }
      },
      post: {
        tags: ['Tagihan'],
        summary: 'Buat tagihan baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['penyewaId', 'asetId'],
                properties: {
                  penyewaId: { type: 'string' },
                  asetId: { type: 'string' },
                  dueDate: { type: 'string', format: 'date-time' },
                  totalAmount: { type: 'number' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Tagihan berhasil dibuat' } }
      }
    },
    '/tagihan/{id}': {
      get: {
        tags: ['Tagihan'],
        summary: 'Detail tagihan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detail tagihan' } }
      },
      put: {
        tags: ['Tagihan'],
        summary: 'Update tagihan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Tagihan' } } } },
        responses: { '200': { description: 'Tagihan berhasil diupdate' } }
      },
      delete: {
        tags: ['Tagihan'],
        summary: 'Hapus tagihan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Tagihan berhasil dihapus' } }
      }
    },
    '/tagihan/{id}/send-email': {
      post: {
        tags: ['Tagihan'],
        summary: 'Kirim email tagihan ke penyewa',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Email berhasil dikirim' } }
      }
    },
    // ─── INVOICE ──────────────────────────────────────────────────
    '/invoice': {
      get: {
        tags: ['Invoice'],
        summary: 'List invoice',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'List invoice' } }
      },
      post: {
        tags: ['Invoice'],
        summary: 'Buat invoice baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tagihanId: { type: 'string' },
                  totalAmount: { type: 'number' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Invoice berhasil dibuat' } }
      }
    },
    '/invoice/{id}': {
      get: {
        tags: ['Invoice'],
        summary: 'Detail invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detail invoice' } }
      },
      put: {
        tags: ['Invoice'],
        summary: 'Update invoice (konfirmasi pembayaran)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  tanggalBayar: { type: 'string', format: 'date-time' },
                  buktiPembayaran: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Invoice berhasil diupdate' } }
      },
      delete: {
        tags: ['Invoice'],
        summary: 'Hapus invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Invoice berhasil dihapus' } }
      }
    },
    '/invoice/{id}/check': {
      get: {
        tags: ['Invoice'],
        summary: 'Cek status pembayaran invoice',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Status pembayaran' } }
      }
    },
    '/admin/invoice': {
      get: {
        tags: ['Invoice'],
        summary: 'List semua invoice lintas company (Admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'company', in: 'query', schema: { type: 'string' } },
          { name: 'dari', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Tanggal bayar dari' },
          { name: 'sampai', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Tanggal bayar sampai' },
          { name: 'invDari', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Tanggal invoice dari' },
          { name: 'invSampai', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Tanggal invoice sampai' }
        ],
        responses: { '200': { description: 'List invoice' } }
      }
    },
    // ─── KEUANGAN ──────────────────────────────────────────────────
    '/keuangan': {
      get: {
        tags: ['Keuangan'],
        summary: 'List transaksi keuangan',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'dari', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sampai', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: { '200': { description: 'List keuangan' } }
      },
      post: {
        tags: ['Keuangan'],
        summary: 'Tambah transaksi keuangan',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jenis', 'jumlah', 'tanggal'],
                properties: {
                  jenis: { type: 'string', enum: ['PEMASUKAN', 'PENGELUARAN'] },
                  jumlah: { type: 'number' },
                  tanggal: { type: 'string', format: 'date-time' },
                  keterangan: { type: 'string' },
                  categoryId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Transaksi berhasil ditambahkan' } }
      }
    },
    '/keuangan/{id}': {
      put: {
        tags: ['Keuangan'],
        summary: 'Update transaksi keuangan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Transaksi berhasil diupdate' } }
      },
      delete: {
        tags: ['Keuangan'],
        summary: 'Hapus transaksi keuangan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Transaksi berhasil dihapus' } }
      }
    },
    '/keuangan/summary': {
      get: {
        tags: ['Keuangan'],
        summary: 'Ringkasan keuangan (total pemasukan vs pengeluaran)',
        parameters: [
          { name: 'dari', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sampai', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: { '200': { description: 'Ringkasan keuangan' } }
      }
    },
    '/keuangan/report': {
      get: {
        tags: ['Keuangan'],
        summary: 'Laporan keuangan periodik',
        parameters: [
          { name: 'dari', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sampai', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'groupBy', in: 'query', schema: { type: 'string', enum: ['day', 'month', 'year'] } }
        ],
        responses: { '200': { description: 'Laporan keuangan' } }
      }
    },
    // ─── ROLE ──────────────────────────────────────────────────
    '/role': {
      get: {
        tags: ['Role'],
        summary: 'List role',
        responses: {
          '200': {
            description: 'List role',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Role' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Role'],
        summary: 'Buat role baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama'],
                properties: {
                  nama: { type: 'string' },
                  deskripsi: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Role berhasil dibuat' } }
      }
    },
    '/role/{id}': {
      get: {
        tags: ['Role'],
        summary: 'Detail role',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detail role' } }
      },
      put: {
        tags: ['Role'],
        summary: 'Update role',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } } },
        responses: { '200': { description: 'Role berhasil diupdate' } }
      },
      delete: {
        tags: ['Role'],
        summary: 'Hapus role',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Role berhasil dihapus' } }
      }
    },
    '/role/{id}/menus': {
      get: {
        tags: ['Role'],
        summary: 'List menu yang dimiliki role',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'List menu untuk role ini' } }
      },
      put: {
        tags: ['Role'],
        summary: 'Set menu untuk role (replace all)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  menuIds: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Menu role berhasil diupdate' } }
      }
    },
    // ─── MENU ──────────────────────────────────────────────────
    '/menu': {
      get: {
        tags: ['Menu'],
        summary: 'List semua menu',
        responses: {
          '200': {
            description: 'List menu',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Menu' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Menu'],
        summary: 'Tambah menu baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama'],
                properties: {
                  nama: { type: 'string' },
                  path: { type: 'string' },
                  icon: { type: 'string' },
                  urutan: { type: 'integer' },
                  parentId: { type: 'string' },
                  status: { type: 'boolean', default: true },
                  keterangan: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Menu berhasil ditambahkan' } }
      }
    },
    '/menu/{id}': {
      get: {
        tags: ['Menu'],
        summary: 'Detail menu',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detail menu' } }
      },
      put: {
        tags: ['Menu'],
        summary: 'Update menu',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Menu' } } } },
        responses: { '200': { description: 'Menu berhasil diupdate' } }
      },
      delete: {
        tags: ['Menu'],
        summary: 'Hapus menu',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Menu berhasil dihapus' } }
      }
    },
    '/menu/user': {
      get: {
        tags: ['Menu'],
        summary: 'List menu yang bisa diakses user yang sedang login',
        responses: { '200': { description: 'List menu user' } }
      }
    },
    '/menu/by-paket': {
      get: {
        tags: ['Menu'],
        summary: 'List menu berdasarkan paket',
        parameters: [{ name: 'paketId', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'List menu untuk paket' } }
      }
    },
    // ─── MASTER WILAYAH ──────────────────────────────────────────────────
    '/master/provinsi': {
      get: {
        tags: ['Master Wilayah'],
        summary: 'List semua provinsi',
        responses: {
          '200': {
            description: 'List provinsi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/master/kota/{provinceId}': {
      get: {
        tags: ['Master Wilayah'],
        summary: 'List kota/kabupaten berdasarkan provinsi',
        parameters: [{ name: 'provinceId', in: 'path', required: true, schema: { type: 'string' }, example: '11' }],
        responses: { '200': { description: 'List kota' } }
      }
    },
    '/master/kecamatan/{cityId}': {
      get: {
        tags: ['Master Wilayah'],
        summary: 'List kecamatan berdasarkan kota',
        parameters: [{ name: 'cityId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'List kecamatan' } }
      }
    },
    '/master/kelurahan/{districtId}': {
      get: {
        tags: ['Master Wilayah'],
        summary: 'List kelurahan/desa berdasarkan kecamatan',
        parameters: [{ name: 'districtId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'List kelurahan' } }
      }
    },
    // ─── MASTER PAKET ──────────────────────────────────────────────────
    '/master/paket': {
      get: {
        tags: ['Master Paket'],
        summary: 'List paket layanan',
        responses: {
          '200': {
            description: 'List paket',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Paket' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Master Paket'],
        summary: 'Tambah paket baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama', 'hargaBulanan'],
                properties: {
                  nama: { type: 'string' },
                  deskripsi: { type: 'string' },
                  hargaBulanan: { type: 'number' },
                  hargaTahunan: { type: 'number' },
                  status: { type: 'boolean', default: true }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Paket berhasil ditambahkan' } }
      }
    },
    '/master/paket/{id}': {
      get: {
        tags: ['Master Paket'],
        summary: 'Detail paket',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detail paket' } }
      },
      put: {
        tags: ['Master Paket'],
        summary: 'Update paket',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Paket' } } } },
        responses: { '200': { description: 'Paket berhasil diupdate' } }
      },
      delete: {
        tags: ['Master Paket'],
        summary: 'Hapus paket',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Paket berhasil dihapus' } }
      }
    },
    '/master/paket/subscribe': {
      post: {
        tags: ['Master Paket'],
        summary: 'Subscribe company ke paket tertentu',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['paketId'],
                properties: {
                  paketId: { type: 'string' },
                  durasi: { type: 'string', enum: ['bulanan', 'tahunan'], default: 'bulanan' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Subscribe berhasil' } }
      }
    },
    '/paket/trial': {
      post: {
        tags: ['Master Paket'],
        summary: 'Aktifkan trial paket untuk company',
        responses: { '200': { description: 'Trial berhasil diaktifkan' } }
      }
    },
    // ─── MASTER JENIS ASET ──────────────────────────────────────────────────
    '/master/jenis-aset': {
      get: {
        tags: ['Master Jenis Aset'],
        summary: 'List jenis aset',
        responses: { '200': { description: 'List jenis aset' } }
      },
      post: {
        tags: ['Master Jenis Aset'],
        summary: 'Tambah jenis aset baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama'],
                properties: {
                  nama: { type: 'string' },
                  keterangan: { type: 'string' },
                  status: { type: 'boolean', default: true }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Jenis aset berhasil ditambahkan' } }
      }
    },
    '/master/jenis-aset/{id}': {
      put: {
        tags: ['Master Jenis Aset'],
        summary: 'Update jenis aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/JenisAset' } } } },
        responses: { '200': { description: 'Jenis aset berhasil diupdate' } }
      },
      delete: {
        tags: ['Master Jenis Aset'],
        summary: 'Hapus jenis aset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Jenis aset berhasil dihapus' } }
      }
    },
    // ─── MASTER ICON ──────────────────────────────────────────────────
    '/master/icon': {
      get: {
        tags: ['Master Icon'],
        summary: 'List icon',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'List icon' } }
      },
      post: {
        tags: ['Master Icon'],
        summary: 'Tambah icon baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama', 'code'],
                properties: {
                  nama: { type: 'string' },
                  code: { type: 'string', example: 'tabler-home' },
                  status: { type: 'boolean', default: true }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Icon berhasil ditambahkan' } }
      }
    },
    '/master/icon/{id}': {
      put: {
        tags: ['Master Icon'],
        summary: 'Update icon',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Icon' } } } },
        responses: { '200': { description: 'Icon berhasil diupdate' } }
      },
      delete: {
        tags: ['Master Icon'],
        summary: 'Hapus icon',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Icon berhasil dihapus' } }
      }
    },
    '/master/icon/dropdown': {
      get: {
        tags: ['Master Icon'],
        summary: 'Dropdown list icon',
        responses: { '200': { description: 'List icon untuk dropdown' } }
      }
    },
    // ─── NOTIFIKASI ──────────────────────────────────────────────────
    '/notifikasi': {
      get: {
        tags: ['Notifikasi'],
        summary: 'List notifikasi user',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'List notifikasi' } }
      }
    },
    '/notifikasi/{id}': {
      put: {
        tags: ['Notifikasi'],
        summary: 'Tandai notifikasi sudah dibaca',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Notifikasi berhasil diupdate' } }
      }
    },
    '/notifikasi/read-all': {
      put: {
        tags: ['Notifikasi'],
        summary: 'Tandai semua notifikasi sudah dibaca',
        responses: { '200': { description: 'Semua notifikasi ditandai sudah dibaca' } }
      }
    },
    // ─── SETTING ──────────────────────────────────────────────────
    '/setting/company': {
      get: {
        tags: ['Setting'],
        summary: 'Ambil setting company yang sedang login',
        responses: { '200': { description: 'Setting company' } }
      },
      put: {
        tags: ['Setting'],
        summary: 'Update setting company',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nama: { type: 'string' },
                  email: { type: 'string' },
                  telepon: { type: 'string' },
                  alamat: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Setting berhasil diupdate' } }
      }
    },
    '/setting/category-keuangan': {
      get: {
        tags: ['Setting'],
        summary: 'List kategori keuangan',
        responses: { '200': { description: 'List kategori keuangan' } }
      },
      post: {
        tags: ['Setting'],
        summary: 'Tambah kategori keuangan',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama', 'jenis'],
                properties: {
                  nama: { type: 'string' },
                  jenis: { type: 'string', enum: ['PEMASUKAN', 'PENGELUARAN'] }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Kategori berhasil ditambahkan' } }
      }
    },
    '/setting/category-keuangan/{id}': {
      put: {
        tags: ['Setting'],
        summary: 'Update kategori keuangan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Kategori berhasil diupdate' } }
      },
      delete: {
        tags: ['Setting'],
        summary: 'Hapus kategori keuangan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Kategori berhasil dihapus' } }
      }
    },
    // ─── DASHBOARD ──────────────────────────────────────────────────
    '/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Ambil statistik untuk dashboard',
        responses: { '200': { description: 'Statistik dashboard' } }
      }
    },
    // ─── UPLOAD ──────────────────────────────────────────────────
    '/upload/bukti-pembayaran': {
      post: {
        tags: ['Upload'],
        summary: 'Upload bukti pembayaran tagihan',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } }
              }
            }
          }
        },
        responses: { '200': { description: 'File berhasil diupload', content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string' } } } } } } }
      }
    },
    '/upload/invoice-bukti-pembayaran': {
      post: {
        tags: ['Upload'],
        summary: 'Upload bukti pembayaran invoice (admin)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } }
              }
            }
          }
        },
        responses: { '200': { description: 'File berhasil diupload' } }
      }
    },
    '/upload/paket-icon': {
      post: {
        tags: ['Upload'],
        summary: 'Upload icon untuk paket',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } }
              }
            }
          }
        },
        responses: { '200': { description: 'Icon berhasil diupload' } }
      }
    },
    '/user/profile/photo': {
      post: {
        tags: ['User'],
        summary: 'Upload foto profil user',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } }
              }
            }
          }
        },
        responses: { '200': { description: 'Foto berhasil diupload' } }
      }
    },
    // ─── ADMIN ──────────────────────────────────────────────────
    '/admin/sync-wilayah': {
      post: {
        tags: ['Admin'],
        summary: 'Trigger sync wilayah manual untuk satu provinsi (SUPER ADMIN)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['provinceId'],
                properties: {
                  provinceId: { type: 'string', example: '11', description: 'ID provinsi dari API wilayah Indonesia (contoh: 11 = Aceh, 32 = Jawa Barat)' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Sync berhasil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        addedProvinces: { type: 'integer' },
                        addedCities: { type: 'integer' },
                        addedDistricts: { type: 'integer' },
                        addedVillages: { type: 'integer' },
                        skipped: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': { description: 'provinceId wajib diisi' },
          '403': { description: 'Hanya SUPER ADMIN' },
          '500': { description: 'ID provinsi tidak ditemukan atau error sync' }
        }
      }
    },
    '/admin/seed-menu': {
      post: {
        tags: ['Admin'],
        summary: 'Seed menu Konfirmasi Pembayaran ke database',
        responses: {
          '201': { description: 'Menu berhasil ditambahkan' },
          '200': { description: 'Menu sudah ada' }
        }
      }
    },
    '/admin/seed-kalender': {
      post: {
        tags: ['Admin'],
        summary: 'Seed menu Kalender ke database',
        responses: {
          '201': { description: 'Menu berhasil ditambahkan' },
          '200': { description: 'Menu sudah ada' }
        }
      }
    },
    // ─── PUBLIC ──────────────────────────────────────────────────
    '/public/paket': {
      get: {
        tags: ['Public'],
        summary: 'List paket aktif untuk halaman landing (tanpa auth)',
        security: [],
        responses: { '200': { description: 'List paket aktif' } }
      }
    },
    '/public/aset': {
      get: {
        tags: ['Public'],
        summary: 'List aset yang dipublikasikan (tanpa auth)',
        security: [],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'List aset publik' } }
      }
    },
    '/health': {
      get: {
        tags: ['Public'],
        summary: 'Health check server',
        security: [],
        responses: {
          '200': {
            description: 'Server sehat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/kalender': {
      get: {
        tags: ['Dashboard'],
        summary: 'Data kalender booking',
        parameters: [
          { name: 'dari', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sampai', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'asetId', in: 'query', schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Data kalender' } }
      }
    }
  }
}

export default swaggerSpec

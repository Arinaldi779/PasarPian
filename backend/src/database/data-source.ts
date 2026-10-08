import 'dotenv/config';
import { DataSource } from 'typeorm';
import { InitPasarPianSchema1791321600000 } from './migrations/1791321600000-InitPasarPianSchema.js';

/**
 * Koneksi database PasarPian (PostgreSQL via TypeORM).
 *
 * Apa ini? Satu DataSource untuk seluruh backend: dipakai CLI migration,
 * seeder, dan DatabaseModule saat aplikasi berjalan.
 * Untuk apa? Satu sumber konfigurasi koneksi — kredensial hanya dari
 * environment variable (.env), tidak pernah di-hardcode (AGENTS #10).
 * Kenapa begini? `synchronize: false` wajib — ARCHITECTURE §6 melarang
 * sinkronisasi otomatis; schema hanya boleh berubah lewat migration eksplisit.
 * Daftar migration diimpor eksplisit (bukan glob) supaya konsisten saat
 * dijalankan via tsx maupun hasil compile `dist/`.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'pasarpian_erp',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  entities: [],
  migrations: [InitPasarPianSchema1791321600000],
});

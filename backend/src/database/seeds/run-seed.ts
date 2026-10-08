import { AppDataSource } from '../data-source.js';
import { seedDatabase } from './seed.js';

/**
 * Titik masuk seeder: `npm run db:seed` (jalankan SETELAH `npm run db:migrate`).
 *
 * Apa ini? Skrip sekali-jalan yang menyalakan DataSource, mengisi data contoh,
 * lalu menutup koneksi. Untuk apa? Mengisi database kosong tanpa membuka
 * aplikasi — idempoten (berhenti sopan bila users sudah terisi).
 */
async function main(): Promise<void> {
  await AppDataSource.initialize();
  try {
    await seedDatabase(AppDataSource);
  } finally {
    await AppDataSource.destroy();
  }
}

await main().catch((error: unknown) => {
  console.error('Seeder gagal:', error);
  process.exit(1);
});

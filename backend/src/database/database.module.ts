import { Module } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { AppDataSource } from './data-source.js';

/**
 * Token provider koneksi database untuk disuntik ke service modul domain.
 * Dipisah sebagai konstanta supaya tidak ada string ajaib tersebar (AGENTS #24).
 */
export const DATA_SOURCE = 'DATA_SOURCE';

/**
 * Modul database: menginisialisasi satu DataSource bersama untuk aplikasi.
 *
 * Apa ini? Provider NestJS yang menyalakan koneksi PostgreSQL sekali saat boot.
 * Untuk apa? Service modul domain (orders, payments, ...) nantinya menyuntik
 * DATA_SOURCE ini untuk query via TypeORM — tanpa membuka koneksi sendiri.
 * Kenapa ada? Satu koneksi bersama = connection pool tunggal, mudah dilacak.
 */
@Module({
  providers: [
    {
      provide: DATA_SOURCE,
      useFactory: async (): Promise<DataSource> => {
        if (!AppDataSource.isInitialized) {
          await AppDataSource.initialize();
        }
        return AppDataSource;
      },
    },
  ],
  exports: [DATA_SOURCE],
})
export class DatabaseModule {}

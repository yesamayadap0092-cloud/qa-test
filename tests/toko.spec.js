import { test, expect } from '@playwright/test';
import { urlApp } from './app.js'; // sesuaikan kalau app.js memakai default export

const rupiah = (teks) => Number(teks.replace(/[^\d]/g, ''));

test.beforeEach(async ({ page }) => {
  await page.goto(urlApp); // tiap tes mulai dari kondisi bersih
});

async function isiRegistrasi(page, { nama, email, password, usia }) {
  await page.locator('#nama').fill(nama);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#usia').fill(usia);
  await page.getByRole('button', { name: 'Daftar' }).click();
}

// Skenario 1
test('registrasi berhasil dengan data valid', async ({ page }) => {
  await isiRegistrasi(page, {
    nama: 'Citra Lestari',
    email: `citra${Date.now()}@mail.com`,
    password: 'rahasia123',
    usia: '25',
  });
  const pesan = page.locator('#pesan-registrasi');
  await expect(pesan).toBeVisible();
  await expect(pesan).toContainText(/berhasil/i);
});

// Skenario 2a
test('registrasi gagal: nama kosong', async ({ page }) => {
  await isiRegistrasi(page, {
    nama: '',
    email: `a${Date.now()}@mail.com`,
    password: 'rahasia123',
    usia: '25',
  });
  const pesan = page.locator('#pesan-registrasi');
  await expect(pesan).toBeVisible();
  await expect(pesan).not.toContainText(/berhasil/i);
  await expect(pesan).toContainText(/nama/i);
});

// Skenario 2b
test('registrasi gagal: usia 16', async ({ page }) => {
  await isiRegistrasi(page, {
    nama: 'Dewi Anggraini',
    email: `d${Date.now()}@mail.com`,
    password: 'rahasia123',
    usia: '16',
  });
  const pesan = page.locator('#pesan-registrasi');
  await expect(pesan).toBeVisible();
  await expect(pesan).not.toContainText(/berhasil/i);
  await expect(pesan).toContainText(/usia/i);
});

// Skenario 3
test('belanja: saldo berkurang sesuai total dan pesanan masuk riwayat', async ({ page }) => {
  const saldo = page.locator('#saldo');
  const total = page.locator('#total');
  const saldoAwal = rupiah(await saldo.innerText());

  await page.getByRole('row', { name: /Keyboard/i }).getByRole('button').click();

  const totalBayar = rupiah(await total.innerText());
  expect(totalBayar).toBeGreaterThan(0);

  await page.locator('#btn-bayar').click();

  await expect(page.locator('#pesan-checkout')).toContainText(/berhasil/i);
  expect(rupiah(await saldo.innerText())).toBe(saldoAwal - totalBayar);

  const item = page.locator('#riwayat li');
  await expect(item).toHaveCount(1);
  await expect(item.first()).toContainText(/Pesanan #\d+/);
  const teks = await item.first().innerText();     // "Pesanan #1 - Rp150.000"
  expect(rupiah(teks.split('-')[1])).toBe(totalBayar);
});
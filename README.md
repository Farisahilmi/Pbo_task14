# 🎬 MovieTickets Platform - Online Booking & Cinema Management System

Platform pemesanan tiket bioskop modern berkinerja tinggi yang dibangun dengan arsitektur **Backend Java Quarkus & PostgreSQL 16** dan **Frontend React Vite (Vanilla CSS Premium Dark Cinema Theme)**.

---

## 🚀 Cara Menjalankan Aplikasi (Windows / WSL)

Aplikasi ini sudah dilengkapi dengan skrip pengaktifan otomatis yang menangani environment Windows & Linux WSL:

1. **Jalankan Aplikasi:** Klik ganda atau jalankan melalui terminal file `Jalankan_MovieTickets.bat`.
   - Backend Quarkus API akan aktif di: **http://localhost:8080**
   - Frontend React Web akan aktif di: **http://localhost:5173**
2. **Hentikan Aplikasi:** Klik ganda file `Hentikan_MovieTickets.bat`.

---

## 💳 Panduan Integrasi Pembayaran Virtual - Midtrans Sandbox SNAP API

Platform ini menggunakan sistem pembayaran terintegrasi **Midtrans Sandbox SNAP API** dengan dukungan UI interaktif langsung di frontend serta verifikasi keamanan Webhook berbasis **SHA512 Kriptografi** di backend.

### 1. Konfigurasi Kredensial Environment
Kredensial akun Midtrans Sandbox dipisahkan berdasarkan environment (`%dev` dan `%prod`) pada file [application.properties](file:///d:/Projects/MovieTickets/backend/src/main/resources/application.properties):
```properties
%dev.midtrans.server-key=${MIDTRANS_SANDBOX_SERVER_KEY:SB-Mid-server-DemoSandboxKey123}
%dev.midtrans.client-key=${MIDTRANS_SANDBOX_CLIENT_KEY:SB-Mid-client-DemoSandboxKey123}
%dev.midtrans.base-url=https://app.sandbox.midtrans.com
%dev.midtrans.api-base-url=https://api.sandbox.midtrans.com
```
> [!TIP]
> Anda tidak perlu mengubah kode saat berpindah dari komputer lokal ke server produksi; cukup atur *environment variable* `MIDTRANS_SANDBOX_SERVER_KEY` dan `MIDTRANS_SANDBOX_CLIENT_KEY` pada sistem operasi Anda.

---

### 2. Alur Pengujian Pembayaran di Simulator Resmi
Untuk menguji transaksi pembayaran seolah-olah menggunakan uang asli (tanpa memotong saldo nyata):

1. **Buat Pesanan Tiket:** Login sebagai customer demo (`budi@gmail.com` / `budi123`), pilih film, jadwal tayang, dan kursi bioskop, lalu klik **"Bayar Sekarang"**.
2. **Pilih Metode Midtrans Snap Sandbox:** Di dalam modal pembayaran, pilih tab **"Midtrans Snap Sandbox"** dan klik tombol **"Buka Popup Pembayaran Midtrans Snap"**.
3. **Pilih Virtual Account (VA):** Pada antarmuka popup Midtrans yang muncul di atas layar, pilih metode pembayaran seperti **BCA Virtual Account**, **BNI Virtual Account**, atau **BRI Virtual Account**.
4. **Salin Nomor VA:** Salin nomor Virtual Account yang ditampilkan (misalnya: `80777xxxxxxxx`).
5. **Simulasikan Pembayaran Lunas:**
   - Buka Simulator Resmi Midtrans: [simulator.sandbox.midtrans.com](https://simulator.sandbox.midtrans.com/)
   - Pilih bank yang sesuai (misal: *BCA Virtual Account*).
   - Tempel (*paste*) nomor VA yang sudah disalin dan klik **Inquire**.
   - Klik **Pay** untuk melunasi tagihan.
6. **Verifikasi E-Ticket Otomatis:**
   - Server Midtrans akan mengirimkan notifikasi Webhook (`POST /api/v1/payments/webhook/midtrans`).
   - Backend Quarkus memvalidasi *signature SHA512*, mengubah status pesanan menjadi `PAID`, dan **menerbitkan e-ticket ber-QR code aktif**.
   - Halaman frontend otomatis beralih ke menu **"My Tickets"** dengan tiket Anda siap di-scan di bioskop!

---

## 🧪 Pengujian Otomatis (Integration Test Suite)

Sistem telah dikonfigurasi dengan *automated test suite* menggunakan Maven di dalam Linux WSL:
- **Pengujian Midtrans Payment Lifecycle & Security Webhook:**
  ```bash
  wsl --exec bash -c "cd /mnt/d/Projects/MovieTickets/backend && mvn test -Dtest=MidtransPaymentIntegrationTest"
  ```
- **Pengujian Alur End-to-End & Ticket Self-Healing:**
  ```bash
  wsl --exec bash -c "cd /mnt/d/Projects/MovieTickets/backend && mvn test -Dtest=TicketFlowIntegrationTest"
  ```
Kedua suite pengujian telah terverifikasi **100% Lulus (BUILD SUCCESS)**.

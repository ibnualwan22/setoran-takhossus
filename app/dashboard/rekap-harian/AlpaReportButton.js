'use client';

export default function AlpaReportButton({ groupedAlpa }) {
  
  const generateWhatsAppMessage = () => {
    let message = `*🚨 LAPORAN SANTRI BELUM SETORAN WAJIB HARI INI 🚨*\n\n`;
    message += `Assalamualaikum Wr. Wb.\nMohon perhatian kepada para Ustadz/Penyimak, berikut adalah daftar santri yang hingga saat ini belum melakukan setoran wajib:\n\n`;

    // Loop melalui grup penyimak
    Object.keys(groupedAlpa).sort().forEach(penyimakName => {
      message += `*👳‍♂️ Penyimak: ${penyimakName}*\n`;
      groupedAlpa[penyimakName].forEach((santriName, index) => {
        message += `${index + 1}. ${santriName}\n`;
      });
      message += `\n`; // Spasi antar penyimak
    });

    message += `--------------------\n`;
    message += `*❗ HIMBAUAN & PERINGATAN ❗*\n`;
    message += `Mohon kepada Ustadz/Penyimak yang bersangkutan untuk:\n`;
    message += `1. Segera *mencari dan mengingatkan* santri di atas.\n`;
    message += `2. *Memastikan* santri melakukan setoran sebelum waktu habis.\n`;
    message += `3. *Meningkatkan kepedulian* terhadap perkembangan setoran santri asuhannya.\n\n`;
    message += `Terima kasih atas perhatian dan kerjasamanya.\nWassalamualaikum Wr. Wb.\n\n`;
    message += `_Pesan ini dibuat otomatis oleh Sistem Setoran Takhossus_`;

    return message;
  };

  const handleSendToWhatsApp = () => {
    const message = generateWhatsAppMessage();
    // Encode pesan untuk URL
    const encodedMessage = encodeURIComponent(message);
    // Buat link wa.me (akan membuka WhatsApp)
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    
    // Buka di tab baru
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div>
        <p className="text-sm text-yellow-800 mb-3">
            Klik tombol di bawah untuk membuat pesan laporan santri yang belum setoran hari ini. 
            Anda perlu memilih grup WhatsApp tujuan secara manual setelah mengklik tombol.
        </p>
        <button
          onClick={handleSendToWhatsApp}
          className="px-4 py-2 font-medium text-white bg-whatsapp-green rounded-md hover:bg-whatsapp-darkgreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-green"
          style={{ backgroundColor: '#25D366', '--hover-bg': '#128C7E' }} // Inline style for WA colors
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#128C7E'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#25D366'}
        >
          Buat Laporan WA Santri Alpa
        </button>
    </div>
  );
}

// Anda mungkin perlu menambahkan warna WhatsApp ke tailwind.config.js
// atau gunakan inline style seperti di atas.
/* Contoh di tailwind.config.js
 extend: {
   colors: {
     'whatsapp-green': '#25D366',
     'whatsapp-darkgreen': '#128C7E',
   },
 },
*/
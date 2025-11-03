'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Fungsi helper untuk mendapatkan bulan/tahun saat ini (WIB)
function getCurrentWIBDate() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  return {
    month: now.getMonth() + 1, // getMonth() 0-11, jadi +1
    year: now.getFullYear(),
  };
}

export default function MonthFilter() {
  const router = useRouter();
  const pathname = usePathname(); // Path saat ini (cth: /dashboard/riwayat-global)
  const searchParams = useSearchParams(); // Parameter URL (cth: ?month=10)

  const { month: currentMonth, year: currentYear } = getCurrentWIBDate();

  // Ambil filter dari URL, atau gunakan default (bulan ini)
  const selectedMonth = searchParams.get('month') || currentMonth;
  const selectedYear = searchParams.get('year') || currentYear;

  const handleFilterChange = (e) => {
    e.preventDefault();
    const newMonth = e.target.form.month.value;
    const newYear = e.target.form.year.value;

    // Buat parameter URL baru
    const params = new URLSearchParams();
    params.set('month', newMonth);
    params.set('year', newYear);

    // Refresh halaman (memicu Server Component) dengan parameter baru
    router.push(`${pathname}?${params.toString()}`);
  };

  // Daftar bulan
  const months = [
    { value: 1, name: 'Januari' }, { value: 2, name: 'Februari' },
    { value: 3, name: 'Maret' }, { value: 4, name: 'April' },
    { value: 5, name: 'Mei' }, { value: 6, name: 'Juni' },
    { value: 7, name: 'Juli' }, { value: 8, name: 'Agustus' },
    { value: 9, name: 'September' }, { value: 10, name: 'Oktober' },
    { value: 11, name: 'November' }, { value: 12, name: 'Desember' },
  ];

  // Daftar tahun (3 tahun ke belakang & tahun ini)
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 3 + i).reverse();

  return (
      <form className="mb-6 p-4 border rounded-lg bg-gray-50 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-grow w-full">
        <label htmlFor="month" className="block text-sm font-medium text-gray-700">
          Pilih Bulan
        </label>
        <select
          id="month"
          name="month"
          defaultValue={selectedMonth}
          className="w-full mt-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
        >
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.name}</option>
          ))}
        </select>
      </div>
      <div className="flex-grow w-full">
        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
          Pilih Tahun
        </label>
        <select
          id="year"
          name="year"
          defaultValue={selectedYear}
          className="w-full mt-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="w-full md:w-auto md:mt-6">
        <button
          type="submit"
          onClick={handleFilterChange}
        className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Tampilkan
        </button>
      </div>
    </form>
  );
}
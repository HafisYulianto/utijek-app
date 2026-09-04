export interface LocationItem {
  name: string
  address: string
  coords: [number, number] // [lng, lat]
  category: 'campus' | 'mall' | 'transport' | 'hospital' | 'food' | 'public'
  icon: string
}

export const UTI_DEFAULT_COORDS: [number, number] = [105.257723, -5.381786] // [lng, lat] Universitas Teknokrat Indonesia

export const POPULAR_LOCATIONS: LocationItem[] = [
  // Kampus UTI
  {
    name: 'Universitas Teknokrat Indonesia (Gerbang Utama)',
    address: 'Jl. H. Zainal Abidin Pagar Alam No.9-11, Kedaton, Bandar Lampung',
    coords: [105.257723, -5.381786],
    category: 'campus',
    icon: '🎓',
  },
  {
    name: 'Gedung A (Rektorat) Teknokrat',
    address: 'Kampus UTI, Jl. ZA Pagar Alam, Kedaton, Bandar Lampung',
    coords: [105.25785, -5.38195],
    category: 'campus',
    icon: '🏛️',
  },
  {
    name: 'Gelanggang Mahasiswa (GSG) Teknokrat',
    address: 'Kampus UTI, Jl. ZA Pagar Alam, Kedaton, Bandar Lampung',
    coords: [105.2582, -5.3821],
    category: 'campus',
    icon: '🏟️',
  },
  {
    name: 'Gedung E / ICT Center Teknokrat',
    address: 'Kampus UTI, Jl. ZA Pagar Alam, Kedaton, Bandar Lampung',
    coords: [105.2576, -5.382],
    category: 'campus',
    icon: '💻',
  },
  {
    name: 'Masjid Asmaul Yusuf UTI',
    address: 'Kompleks Kampus UTI, Kedaton, Bandar Lampung',
    coords: [105.258, -5.3816],
    category: 'campus',
    icon: '🕌',
  },
  {
    name: 'Kantin & Pujasera Mahasiswa UTI',
    address: 'Kompleks Belakang Kampus UTI, Kedaton, Bandar Lampung',
    coords: [105.2574, -5.3819],
    category: 'food',
    icon: '🍱',
  },

  // Mall & Belanja
  {
    name: 'Mall Boemi Kedaton (MBK)',
    address: 'Jl. Teuku Umar No.1, Kedaton, Bandar Lampung',
    coords: [105.2587, -5.3804],
    category: 'mall',
    icon: '🛍️',
  },
  {
    name: 'Transmart Lampung',
    address: 'Jl. Sultan Agung No.283, Way Halim, Bandar Lampung',
    coords: [105.2891, -5.3872],
    category: 'mall',
    icon: '🛒',
  },
  {
    name: 'Central Plaza Lampung',
    address: 'Jl. Kartini No.21, Tanjung Karang Pusat, Bandar Lampung',
    coords: [105.2579, -5.4148],
    category: 'mall',
    icon: '🏬',
  },
  {
    name: 'Pasar Koga Kedaton',
    address: 'Jl. Teuku Umar, Sidodadi, Kedaton, Bandar Lampung',
    coords: [105.261, -5.393],
    category: 'public',
    icon: '🏪',
  },

  // Transportasi
  {
    name: 'Stasiun Labuhan Ratu',
    address: 'Labuhan Ratu, Kedaton, Kota Bandar Lampung',
    coords: [105.2599, -5.3789],
    category: 'transport',
    icon: '🚉',
  },
  {
    name: 'Stasiun Tanjung Karang',
    address: 'Jl. Kotaraja No.1, Enggal, Kota Bandar Lampung',
    coords: [105.2605, -5.4102],
    category: 'transport',
    icon: '🚂',
  },
  {
    name: 'Terminal Bus Rajabasa',
    address: 'Jl. ZA Pagar Alam, Rajabasa, Kota Bandar Lampung',
    coords: [105.2341, -5.361],
    category: 'transport',
    icon: '🚌',
  },
  {
    name: 'Bandara Radin Inten II (TKG)',
    address: 'Branti Raya, Natar, Kabupaten Lampung Selatan',
    coords: [105.1789, -5.2425],
    category: 'transport',
    icon: '✈️',
  },

  // Kampus Lain
  {
    name: 'Universitas Lampung (Unila) - Rektorat',
    address: 'Jl. Prof. Dr. Sumantri Brojonegoro No.1, Gedong Meneng, Bandar Lampung',
    coords: [105.2443, -5.3648],
    category: 'campus',
    icon: '🎓',
  },
  {
    name: 'UIN Raden Intan Lampung',
    address: 'Jl. Endro Suratmin, Sukarame, Kota Bandar Lampung',
    coords: [105.2935, -5.3904],
    category: 'campus',
    icon: '🎓',
  },
  {
    name: 'Politeknik Negeri Lampung (Polinela)',
    address: 'Jl. Soekarno Hatta No.10, Rajabasa, Bandar Lampung',
    coords: [105.2319, -5.3582],
    category: 'campus',
    icon: '🎓',
  },
  {
    name: 'Institut Teknologi Sumatera (ITERA)',
    address: 'Jl. Terusan Ryacudu, Way Hui, Lampung Selatan',
    coords: [105.3117, -5.3587],
    category: 'campus',
    icon: '🎓',
  },

  // Rumah Sakit
  {
    name: 'RS Advent Bandar Lampung',
    address: 'Jl. Teuku Umar No.48, Sidodadi, Kedaton, Bandar Lampung',
    coords: [105.2635, -5.3887],
    category: 'hospital',
    icon: '🏥',
  },
  {
    name: 'RSUD Dr. H. Abdul Moeloek (RSAM)',
    address: 'Jl. Dr. Rivai No.6, Penengahan, Kedaton, Bandar Lampung',
    coords: [105.2612, -5.4025],
    category: 'hospital',
    icon: '🏥',
  },
  {
    name: 'RS Immanuel Bandar Lampung',
    address: 'Jl. Soekarno Hatta No.1, Way Dadi, Sukarame, Bandar Lampung',
    coords: [105.2865, -5.3972],
    category: 'hospital',
    icon: '🏥',
  },

  // Kuliner & Tempat Terkenal
  {
    name: 'KFC Kedaton',
    address: 'Jl. ZA Pagar Alam No.1, Kedaton, Bandar Lampung',
    coords: [105.2582, -5.3808],
    category: 'food',
    icon: '🍗',
  },
  {
    name: 'McDonald\'s Kedaton',
    address: 'Jl. ZA Pagar Alam No.25, Kedaton, Bandar Lampung',
    coords: [105.2585, -5.3812],
    category: 'food',
    icon: '🍔',
  },
  {
    name: 'Tugu Adipura / Bundaran Gajah',
    address: 'Pusat Kota Bandar Lampung, Enggal',
    coords: [105.2576, -5.4261],
    category: 'public',
    icon: '🐘',
  },
  {
    name: 'PKOR Way Halim',
    address: 'Way Halim, Kota Bandar Lampung',
    coords: [105.2755, -5.3842],
    category: 'public',
    icon: '🌳',
  },
]

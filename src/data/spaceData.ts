import { SolarSystem, RocketPart } from '../types';

export const SOLAR_SYSTEMS: SolarSystem[] = [
  {
    id: 'sol',
    name: 'Sistem Tata Surya Sol (Kita)',
    difficulty: 'Sangat Mudah',
    description: 'Sistem bintang tempat tinggal kita, berpusat di bintang kerdil kuning G-type bernama Matahari, dikelilingi oleh 8 planet megah dan miliaran objek kecil.',
    star: {
      id: 'sol-sun',
      name: 'Matahari (Sun)',
      type: 'star',
      distanceFromStar: 0,
      radius: 40,
      orbitSpeed: 0,
      color: '#fbbf24',
      glowColor: '#f59e0b',
      details: {
        scientificName: 'Sol',
        typeIndonesian: 'Bintang Utama (Kerdil Kuning)',
        diameter: '1,392,700 km',
        mass: '1.989 x 10^30 kg',
        gravity: '274 m/s²',
        temperature: '5,500°C (Permukaan) / 15 Juta°C (Inti)',
        orbitPeriod: '230 Juta Tahun (Mengitari Galaksi Bimasakti)',
        moonsCount: 0,
        funFact: 'Matahari menyumbang sekitar 99.86% dari seluruh massa di sistem tata surya kita.',
        description: 'Bintang deret utama tipe G yang menghasilkan energi melalui fusi nuklir hidrogen menjadi helium di intinya.'
      }
    },
    planets: [
      {
        id: 'sol-mercury',
        name: 'Merkurius',
        type: 'planet',
        distanceFromStar: 65,
        radius: 10,
        orbitSpeed: 0.04,
        color: '#9ca3af',
        glowColor: '#6b7280',
        details: {
          scientificName: 'Mercurius',
          typeIndonesian: 'Planet Terestrial (Berbatu)',
          diameter: '4,879 km',
          mass: '3.285 x 10^23 kg',
          gravity: '3.7 m/s²',
          temperature: '-173°C hingga 427°C',
          orbitPeriod: '88 Hari',
          moonsCount: 0,
          funFact: 'Satu hari di Merkurius setara dengan 59 hari di Bumi karena rotasinya yang sangat lambat.',
          description: 'Planet terkecil dan terdekat dengan Matahari. Tidak memiliki atmosfer yang signifikan untuk mempertahankan panas.'
        }
      },
      {
        id: 'sol-venus',
        name: 'Venus',
        type: 'planet',
        distanceFromStar: 100,
        radius: 14,
        orbitSpeed: 0.025,
        color: '#f59e0b',
        glowColor: '#ea580c',
        details: {
          scientificName: 'Venus',
          typeIndonesian: 'Planet Terestrial (Berbatu)',
          diameter: '12,104 km',
          mass: '4.867 x 10^24 kg',
          gravity: '8.87 m/s²',
          temperature: '462°C (Konstan)',
          orbitPeriod: '225 Hari',
          moonsCount: 0,
          funFact: 'Venus berputar berlawanan arah dari sebagian besar planet lain di tata surya kita.',
          description: 'Planet terpanas di tata surya kita akibat efek rumah kaca ekstrem dari atmosfer karbon dioksida yang sangat tebal.'
        }
      },
      {
        id: 'sol-earth',
        name: 'Bumi (Earth)',
        type: 'planet',
        distanceFromStar: 145,
        radius: 16,
        orbitSpeed: 0.018,
        color: '#3b82f6',
        glowColor: '#0ea5e9',
        details: {
          scientificName: 'Terra',
          typeIndonesian: 'Planet Terestrial (Berbatu/Air)',
          diameter: '12,742 km',
          mass: '5.972 x 10^24 kg',
          gravity: '9.81 m/s²',
          temperature: '-89°C hingga 58°C',
          orbitPeriod: '365.25 Hari',
          moonsCount: 1,
          funFact: 'Bumi adalah satu-satunya objek astronomi yang diketahui menampung kehidupan dan memiliki air cair stabil di permukaannya.',
          description: 'Rumah bagi umat manusia. Memiliki pelindung magnetosfer yang kuat dan atmosfer kaya oksigen/nitrogen.'
        },
        moons: [
          {
            id: 'sol-moon',
            name: 'Bulan (Moon)',
            type: 'moon',
            distanceFromStar: 25, // relative orbit distance
            radius: 4.5,
            orbitSpeed: 0.08,
            color: '#cbd5e1',
            details: {
              scientificName: 'Luna',
              typeIndonesian: 'Satelit Alami',
              diameter: '3,474 km',
              mass: '7.342 x 10^22 kg',
              gravity: '1.62 m/s²',
              temperature: '-130°C hingga 120°C',
              orbitPeriod: '27.3 Hari',
              moonsCount: 0,
              funFact: 'Bulan terjebak dalam kuncian pasang surut (tidal locking), sehingga kita selalu melihat sisi yang sama dari Bumi.',
              description: 'Satu-satunya satelit alami Bumi dan satu-satunya tempat di luar angkasa yang pernah dijejaki manusia.'
            }
          }
        ]
      },
      {
        id: 'sol-mars',
        name: 'Mars',
        type: 'planet',
        distanceFromStar: 195,
        radius: 12,
        orbitSpeed: 0.012,
        color: '#ef4444',
        glowColor: '#f43f5e',
        details: {
          scientificName: 'Ares',
          typeIndonesian: 'Planet Terestrial (Gurun Merah)',
          diameter: '6,779 km',
          mass: '6.39 x 10^23 kg',
          gravity: '3.72 m/s²',
          temperature: '-143°C hingga 35°C',
          orbitPeriod: '687 Hari',
          moonsCount: 2,
          funFact: 'Mars memiliki gunung berapi terbesar di Tata Surya bernama Olympus Mons, tingginya 3 kali lipat Gunung Everest.',
          description: 'Sering disebut Planet Merah karena kandungan besi oksida (karat) yang melimpah di permukaan tanahnya.'
        },
        moons: [
          {
            id: 'sol-phobos',
            name: 'Phobos',
            type: 'moon',
            distanceFromStar: 18,
            radius: 2.5,
            orbitSpeed: 0.12,
            color: '#94a3b8',
            details: {
              scientificName: 'Phobos',
              typeIndonesian: 'Satelit Alami',
              diameter: '22 km',
              mass: '1.06 x 10^16 kg',
              gravity: '0.0057 m/s²',
              temperature: '-110°C secara rata-rata',
              orbitPeriod: '7.6 Jam',
              moonsCount: 0,
              funFact: 'Phobos mengorbit sangat dekat dengan Mars dan diramalkan akan hancur atau menabrak Mars dalam 50 juta tahun.',
              description: 'Satelit terbesar Mars yang berbentuk tidak teratur seperti kentang berlubang.'
            }
          }
        ],
      },
      {
        id: 'sol-asteroid-belt',
        name: 'Sabuk Asteroid (Ceres)',
        type: 'asteroid',
        distanceFromStar: 222,
        radius: 8,
        orbitSpeed: 0.01,
        color: '#78716c',
        glowColor: '#a8a29e',
        details: {
          scientificName: 'Cingulum Asteroidum',
          typeIndonesian: 'Sabuk Batuan Angkasa & Planet Kerdil',
          diameter: '940 km (Ceres) / Sabuk Luas 1.5 AU',
          mass: '3 x 10^21 kg (Total massa sabuk)',
          gravity: '0.27 m/s² (Ceres)',
          temperature: '-100°C',
          orbitPeriod: '4.6 Tahun Bumi',
          moonsCount: 0,
          funFact: 'Lebih dari 1 juta asteroid bermukim di sini. Ceres, objek bulat terbesar di sabuk ini, menyumbang sepertiga dari total massa seluruh sabuk asteroid!',
          description: 'Sabuk berbentuk donat raksasa berisi miliaran material batuan purba sisa formasi awal tata surya reguler yang gagal menyatu menjadi planet akibat gangguan tarikan gravitasi masif Jupiter.'
        }
      },
      {
        id: 'sol-jupiter',
        name: 'Jupiter',
        type: 'planet',
        distanceFromStar: 260,
        radius: 28,
        orbitSpeed: 0.008,
        color: '#f97316',
        glowColor: '#fdba74',
        details: {
          scientificName: 'Iuppiter',
          typeIndonesian: 'Raksasa Gas (Gas Giant)',
          diameter: '139,820 km',
          mass: '1.898 x 10^27 kg',
          gravity: '24.79 m/s²',
          temperature: '-108°C',
          orbitPeriod: '12 Tahun Bumi',
          moonsCount: 95,
          funFact: 'Bintik Merah Raksasa di Jupiter adalah badai dahsyat berdiameter lebih besar dari Bumi yang telah berkecamuk lebih dari 300 tahun.',
          description: 'Planet terbesar di tata surya kita. Komposisi utamanya adalah gas hidrogen dan helium seperti halnya bintang.'
        },
        moons: [
          {
            id: 'sol-europa',
            name: 'Europa',
            type: 'moon',
            distanceFromStar: 35,
            radius: 4,
            orbitSpeed: 0.05,
            color: '#93c5fd',
            details: {
              scientificName: 'Europa',
              typeIndonesian: 'Satelit Alami Es',
              diameter: '3,121 km',
              mass: '4.8 x 10^22 kg',
              gravity: '1.31 m/s²',
              temperature: '-220°C hingga -160°C',
              orbitPeriod: '3.5 Hari',
              moonsCount: 0,
              funFact: 'Di bawah kerak es setebal kilometer, Europa diduga menyimpan lautan air asin cair raksasa demi potensi kehidupan mikroskopis.',
              description: 'Salah satu dari empat satelit Galilean Jupiter dengan permukaan terhalus karena terdiri dari es air beku.'
            }
          }
        ]
      },
      {
        id: 'sol-saturn',
        name: 'Saturnus',
        type: 'planet',
        distanceFromStar: 330,
        radius: 24,
        orbitSpeed: 0.005,
        color: '#fde047',
        glowColor: '#ca8a04',
        hasRings: true,
        ringsColor: 'rgba(234, 179, 8, 0.45)',
        details: {
          scientificName: 'Saturnus',
          typeIndonesian: 'Raksasa Gas (Gas Giant)',
          diameter: '116,460 km',
          mass: '5.683 x 10^26 kg',
          gravity: '10.44 m/s²',
          temperature: '-139°C',
          orbitPeriod: '29 Tahun Bumi',
          moonsCount: 146,
          funFact: 'Kerapatan rata-rata Saturnus lebih rendah daripada air; jika ada wadah air raksasa, Saturnus akan mengapung di atasnya.',
          description: 'Dihiasi oleh lingkar cincin kosmis yang sangat lebar, terbuat dari pecahan es batu, bebatuan, dan debu angkasa.'
        },
        moons: [
          {
            id: 'sol-titan',
            name: 'Titan',
            type: 'moon',
            distanceFromStar: 34,
            radius: 5,
            orbitSpeed: 0.04,
            color: '#fb923c',
            details: {
              scientificName: 'Titan',
              typeIndonesian: 'Satelit Beratmosfer Padat',
              diameter: '5,149 km',
              mass: '1.345 x 10^23 kg',
              gravity: '1.352 m/s²',
              temperature: '-179°C',
              orbitPeriod: '16 Hari',
              moonsCount: 0,
              funFact: 'Titan adalah satu-satunya satelit di Tata Surya dengan atmosfer tebal, dan satu-satunya tempat dengan danau cairan hidrokarbon (metana/etana).',
              description: 'Satelit alami terbesar Saturnus, berukuran lebih besar dari planet Merkurius.'
            }
          }
        ]
      },
      {
        id: 'sol-uranus',
        name: 'Uranus',
        type: 'planet',
        distanceFromStar: 390,
        radius: 18,
        orbitSpeed: 0.003,
        color: '#22d3ee',
        glowColor: '#06b6d4',
        hasRings: true,
        ringsColor: 'rgba(6, 182, 212, 0.25)',
        details: {
          scientificName: 'Uranus',
          typeIndonesian: 'Raksasa Es (Ice Giant)',
          diameter: '50,724 km',
          mass: '8.681 x 10^25 kg',
          gravity: '8.69 m/s²',
          temperature: '-224°C (Suhu Terendah)',
          orbitPeriod: '84 Tahun Bumi',
          moonsCount: 28,
          funFact: 'Uranus memiliki kemiringan sumbu ekstrem hampir 98 derajat, membuatnya berguling miring seperti bola saat mengitari matahari.',
          description: 'Planet raksasa es beratmosfer dingin kaya metana, hidrogen, dan amonia beku yang memberi warna biru kehijauan.'
        }
      },
      {
        id: 'sol-neptune',
        name: 'Neptunus',
        type: 'planet',
        distanceFromStar: 440,
        radius: 17,
        orbitSpeed: 0.002,
        color: '#2563eb',
        glowColor: '#3b82f6',
        details: {
          scientificName: 'Neptunus',
          typeIndonesian: 'Raksasa Es (Ice Giant)',
          diameter: '49,244 km',
          mass: '1.024 x 10^26 kg',
          gravity: '11.15 m/s²',
          temperature: '-200°C',
          orbitPeriod: '165 Tahun Bumi',
          moonsCount: 16,
          funFact: 'Neptunus memiliki hembusan angin tercepat di Tata Surya, mencapai kecepatan supersonik 2,100 km/jam.',
          description: 'Planet terjauh dari Matahari yang berwarna biru gelap pekat. Atmosfernya sangat dinamis dan memiliki badai pusaran es.'
        }
      }
    ]
  },
  {
    id: 'kepler-18d',
    name: 'Sistem Super-Exoplanet TRAPPIST-1',
    difficulty: 'Sedang',
    description: 'Bintang kerdil merah berjarak 40 tahun cahaya dari Bumi, terkenal karena memiliki 7 planet berbatu berukuran Bumi, tiga di antaranya berada di zona layak huni bintang (goldilocks zone).',
    star: {
      id: 'trappist-star',
      name: 'TRAPPIST-1',
      type: 'star',
      distanceFromStar: 0,
      radius: 35,
      orbitSpeed: 0,
      color: '#ef4444',
      glowColor: '#dc2626',
      details: {
        scientificName: 'TRAPPIST-1 (2MASS J23062928-0502285)',
        typeIndonesian: 'Kerdil Merah M-Ultra Dingin',
        diameter: '168,000 km (Hanya 12% dari Matahari)',
        mass: '1.77 x 10^28 kg (9% dari Matahari)',
        gravity: '410 m/s²',
        temperature: '2,300°C',
        orbitPeriod: 'Mengorbit Galaksi',
        moonsCount: 0,
        funFact: 'Meskipun kecil, TRAPPIST-1 sangat panjang umur, diperkirakan akan tetap memancarkan cahaya hingga 12 triliun tahun.',
        description: 'Bintang kerdil merah kecil yang berjarak sangat dekat dengan planet-planetnya untuk mempertahankan energi panas.'
      }
    },
    planets: [
      {
        id: 'trappist-b',
        name: 'TRAPPIST-1b',
        type: 'planet',
        distanceFromStar: 70,
        radius: 12,
        orbitSpeed: 0.05,
        color: '#f43f5e',
        glowColor: '#fda4af',
        details: {
          scientificName: 'TRAPPIST-1b',
          typeIndonesian: 'Exoplanet Berbatu (Super-Hot)',
          diameter: '14,200 km',
          mass: '6.03 x 10^24 kg',
          gravity: '9.32 m/s²',
          temperature: '127°C hingga 160°C',
          orbitPeriod: '1.5 Hari Bumi',
          moonsCount: 0,
          funFact: 'Planet ini memiliki kuncian pasang surut yang ekstrem sehingga separuh bagian planet terpanggang radiasi abadi.',
          description: 'Exoplanet terdalam dari sistem TRAPPIST. Terdiri dari batu-batuan padat tanpa air.'
        }
      },
      {
        id: 'trappist-d',
        name: 'TRAPPIST-1e (Oasis Kosmis)',
        type: 'planet',
        distanceFromStar: 140,
        radius: 14,
        orbitSpeed: 0.02,
        color: '#10b981',
        glowColor: '#34d399',
        details: {
          scientificName: 'TRAPPIST-1e',
          typeIndonesian: 'Exoplanet Berbatu (Zona Layak Huni)',
          diameter: '11,700 km',
          mass: '4.12 x 10^24 kg',
          gravity: '9.1 m/s²',
          temperature: '-20°C hingga 15°C',
          orbitPeriod: '6.1 Hari Bumi',
          moonsCount: 0,
          funFact: 'TRAPPIST-1e dikonfirmasi memiliki komposisi besi padat, atmosfer tipis kaya nitrogen, dan indikasi air laut cair yang melimpah!',
          description: 'Salah satu exoplanet paling ramah bagi organisme hidup yang pernah diidentifikasi di alam semesta.'
        }
      },
      {
        id: 'trappist-f',
        name: 'TRAPPIST-1g (Arktik Beku)',
        type: 'planet',
        distanceFromStar: 230,
        radius: 16,
        orbitSpeed: 0.012,
        color: '#a5f3fc',
        glowColor: '#22d3ee',
        details: {
          scientificName: 'TRAPPIST-1f',
          typeIndonesian: 'Exoplanet Raksasa Es Berbatu',
          diameter: '13,300 km',
          mass: '6.21 x 10^24 kg',
          gravity: '10.2 m/s²',
          temperature: '-80°C hingga -60°C',
          orbitPeriod: '9.2 Hari Bumi',
          moonsCount: 0,
          funFact: 'TRAPPIST-1g dipenuhi sabuk benua gletser beku yang memiliki atmosfer karbon dioksida basah.',
          description: 'Planet berat dengan selimut atmosfer padat yang memerangkap es tebal di hampir seluruh topografinya.'
        }
      }
    ]
  },
  {
    id: 'kepler-186',
    name: 'Sistem Alien Merah Kepler-186',
    difficulty: 'Tinggi (Jauh)',
    description: 'Sistem bintang yang berjarak 582 tahun cahaya di rasi bintang Cygnus. Sistem ini membuktikan untuk pertama kalinya bahwa planet seukuran Bumi ada di zona layak huni bintang lain.',
    star: {
      id: 'kepler-star',
      name: 'Kepler-186 Star',
      type: 'star',
      distanceFromStar: 0,
      radius: 32,
      orbitSpeed: 0,
      color: '#f97316',
      glowColor: '#ea580c',
      details: {
        scientificName: 'Kepler-186 (Kerdil Merah K-Type)',
        typeIndonesian: 'Bintang Kerdil Oranye-Merah',
        diameter: '660,000 km (Kira-kira setengah ukuran Matahari)',
        mass: '1.09 x 10^29 kg',
        gravity: '290 m/s²',
        temperature: '3,450°C',
        orbitPeriod: '250 Juta Tahun',
        moonsCount: 0,
        funFact: 'Kepler-186 hanya menghasilkan seperdua puluh radiasi panas yang dihasilkan oleh matahari kita.',
        description: 'Bintang kecil tenang beraktivitas rendah, mencerahkan cakrawala sekitarnya dengan fajar kemerahan abadi.'
      }
    },
    planets: [
      {
        id: 'kepler-186c',
        name: 'Kepler-186c',
        type: 'planet',
        distanceFromStar: 90,
        radius: 11,
        orbitSpeed: 0.04,
        color: '#e2e8f0',
        glowColor: '#94a3b8',
        details: {
          scientificName: 'Kepler-186c',
          typeIndonesian: 'Exoplanet Berbatu Kering',
          diameter: '13,200 km',
          mass: '5.2 x 10^24 kg',
          gravity: '11.2 m/s²',
          temperature: '80°C',
          orbitPeriod: '7.2 Hari Bumi',
          moonsCount: 0,
          funFact: 'Planet ini berputar sangat dekat sehingga radiasi angin matahari terus membakar bebatuan permukaannya.',
          description: 'Planet berbatu kering berdebu padat dengan indikasi gurun pasir silikat yang sangat panas.'
        }
      },
      {
        id: 'kepler-186f',
        name: 'Kepler-186f (Bumi Kembar)',
        type: 'planet',
        distanceFromStar: 200,
        radius: 15,
        orbitSpeed: 0.015,
        color: '#a855f7',
        glowColor: '#c084fc',
        details: {
          scientificName: 'Kepler-186f',
          typeIndonesian: 'Sepupu Bumi (Earth Cousin)',
          diameter: '14,000 km',
          mass: '6.4 x 10^24 kg',
          gravity: '9.6 m/s²',
          temperature: '-50°C hingga 10°C',
          orbitPeriod: '129.9 Hari Bumi',
          moonsCount: 1,
          funFact: 'Cahaya tengah hari di Kepler-186f mirip dengan keindahan malam hari menjelang matahari terbenam (sunset) di Bumi.',
          description: 'Planet berbatu berukuran bumi pertama yang diidentifikasi berada dalam wilayah goldilocks zona layak huni.'
        }
      }
    ]
  }
];

export const ROCKET_PARTS: RocketPart[] = [
  // APEX CAPSULES
  {
    id: 'cap_explorer',
    name: 'Kapsul Penjelajah Horizon',
    category: 'capsule',
    weight: 1200,
    power: 2,
    efficiency: 10,
    color: '#38bdf8',
    description: 'Kapsul komando yang ergonomis dilengkapi dengan komputer navigasi holografik modern.',
    iconType: 'pod_rounded'
  },
  {
    id: 'cap_titan',
    name: 'Kapsul Induk Dreadnought',
    category: 'capsule',
    weight: 3500,
    power: 5,
    efficiency: 15,
    color: '#f43f5e',
    description: 'Kabin berpelat titanium ganda, cocok untuk muatan berat dan penerbangan antar sistem bintang.',
    iconType: 'pod_heavy'
  },
  {
    id: 'cap_neon',
    name: 'Modul Inti Cyber-Probe',
    category: 'capsule',
    weight: 600,
    power: 1,
    efficiency: 5,
    color: '#10b981',
    description: 'Sangat ringan namun hanya muat untuk 1 pilot android, menghemat beban total roket secara signifikan.',
    iconType: 'pod_probe'
  },

  // FUEL TANKS
  {
    id: 'fuel_plasma',
    name: 'Tangki Plasma Padat',
    category: 'fuel_tank',
    weight: 2500,
    power: 1500,
    efficiency: 85,
    color: '#06b6d4',
    description: 'Mengisi daya pendorong plasma cair dengan konsistensi kestabilan reaktor yang sangat tinggi.',
    iconType: 'tank_standard'
  },
  {
    id: 'fuel_antimatter',
    name: 'Kompartemen Antimateri',
    category: 'fuel_tank',
    weight: 5000,
    power: 4000,
    efficiency: 95,
    color: '#ec4899',
    description: 'Tangki berkapasitas nuklir magnetis, mampu menyimpan partikel antimateri untuk jangkauan tak berbatas.',
    iconType: 'tank_glowing'
  },
  {
    id: 'fuel_bio',
    name: 'Biosfera Hidrogen Daun',
    category: 'fuel_tank',
    weight: 1800,
    power: 900,
    efficiency: 65,
    color: '#84cc16',
    description: 'Bahan bakar ramah lingkungan hasil klorofasilitasi rumput laut organik fusi hidrokarbon.',
    iconType: 'tank_light'
  },

  // ENGINES
  {
    id: 'eng_merlin',
    name: 'Pendorong Plasma Merlin-9X',
    category: 'engine',
    weight: 1500,
    power: 5000,
    efficiency: 70,
    color: '#f97316',
    description: 'Mesin pendorong andalan dengan semburan api jet silindris konvensional yang bertenaga megah.',
    iconType: 'engine_vector'
  },
  {
    id: 'eng_fusion',
    name: 'Semburan Fusi Nova Core',
    category: 'engine',
    weight: 2900,
    power: 12000,
    efficiency: 92,
    color: '#a855f7',
    description: 'Mengguncang partikel bintang mini langsung di belakang roket untuk energi dorong absolut.',
    iconType: 'engine_fusion'
  },

  // BOOSTERS
  {
    id: 'bst_srb',
    name: 'Booster Padart SRB-Modular',
    category: 'booster',
    weight: 2000,
    power: 4500,
    efficiency: 45,
    color: '#ca8a04',
    description: 'Akselerasi instan saat lepas landas langsung membelah atmosfer Bumi secara kilat.',
    iconType: 'booster_side'
  },
  {
    id: 'bst_ion',
    name: 'Booster Gelombang Ion Magnet',
    category: 'booster',
    weight: 1200,
    power: 3000,
    efficiency: 88,
    color: '#22d3ee',
    description: 'Menciptakan gaya tarik medan elektromagnetik halus untuk dorongan efisien tanpa boros bahan bakar.',
    iconType: 'booster_neon'
  },

  // ACCESSORIES
  {
    id: 'acc_solar',
    name: 'Panel Layar Surya Aurora',
    category: 'accessory',
    weight: 400,
    power: 5,
    efficiency: 20,
    color: '#d946ef',
    description: 'Menyerap radiasi foton bintang secara konstan untuk menghemat cadangan bahan bakar utama.',
    iconType: 'accessory_wings'
  },
  {
    id: 'acc_wings',
    name: 'Sayap Penyeimbang Karbon',
    category: 'accessory',
    weight: 800,
    power: 1,
    efficiency: 5,
    color: '#64748b',
    description: 'Meningkatkan koefisien aerodinamika roket agar melesat tegak tanpa guncangan angin ekstrim.',
    iconType: 'accessory_fins'
  }
];

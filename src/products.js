// Pulmo Care Product Catalogue (Extracted from official Facebook Page)

export const categories = [
  { id: 'all', name: 'All Products', bn: 'সব পণ্য' },
  { id: 'cpap', name: 'CPAP & BiPAP', bn: 'সিপ্যাপ ও বাইপ্যাপ' },
  { id: 'nebulizer', name: 'Nebulizers', bn: 'নেবুলাইজার' },
  { id: 'monitors', name: 'Health Monitors', bn: 'মেডিকেল মনিটর' },
  { id: 'masks', name: 'Masks & Tubing', bn: 'মাস্ক ও এক্সেসরিজ' }
];

export const products = [
  {
    id: 'reshope-cpap',
    name: 'ResHope Auto CPAP / BiPAP Device',
    bnName: 'রেসহোপ অটো সিপ্যাপ ও বাইপ্যাপ মেশিন',
    category: 'cpap',
    price: 68000,
    oldPrice: 75000,
    badge: 'Flagship Therapy',
    rating: 4.9,
    reviews: 42,
    image: '/assets/reshope_cpap.jpg',
    features: [
      'Self-titrating auto pressure algorithm (4 - 25 cmH₂O)',
      'Built-in heated water chamber humidifier',
      'Ultra-silent whisper blower (<26 dB)',
      'Digital color LCD telemetry monitor',
      'Heated corrugated breathing tube included'
    ],
    shortDesc: 'প্রিমিয়াম অটো সিপ্যাপ ডিভাইস — স্লিপ অ্যাপনিয়া ও শ্বাসকষ্টের রোগীদের জন্য নীরব ও স্বস্তিদায়ক সমাধান।'
  },
  {
    id: 'getwell-nebulizer',
    name: 'GETWELL™ Compressor Nebulizer Machine',
    bnName: 'গেটওয়েল কম্প্রেসার নেবুলাইজার মেশিন',
    category: 'nebulizer',
    price: 2450,
    oldPrice: 2800,
    badge: '1 Year Warranty',
    rating: 4.8,
    reviews: 86,
    image: '/assets/nebulizer_device.jpg',
    features: [
      '১ বছরের অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি',
      'শক্তিশালী ও দীর্ঘস্থায়ী পিস্টন কম্প্রেসার',
      'শিশু ও বয়স্ক উভয়ের জন্য আলাদা সফট মাস্ক ও মাউথপিস',
      'সহজে পরিষ্কার ও বহনযোগ্য কমপ্যাক্ট ডিজাইন'
    ],
    shortDesc: 'শ্বাস নিতে স্বস্তি, যত্ন হোক সহজে — অ্যাজমা, অ্যালার্জি ও ব্রঙ্কাইটিসের জন্য ডাক্তারদের বিশ্বস্ত নেবুলাইজার।'
  },
  {
    id: 'jumper-oximeter',
    name: 'JUMPER Fingertip Pulse Oximeter',
    bnName: 'জাম্পার ফিঙ্গারটিপ পালস অক্সিমিটার',
    category: 'monitors',
    price: 1350,
    oldPrice: 1650,
    badge: 'Best Seller',
    rating: 4.9,
    reviews: 128,
    image: '/assets/pulse_oximeter.jpg',
    features: [
      'রক্তের Oxygen Saturation (SpO₂) ও Pulse Rate তাৎক্ষণিক পর্যবেক্ষণ',
      'স্পষ্ট ও উজ্জ্বল ডুয়েল-কালার OLED ডিসপ্লে',
      'অটো শাট-অফ ও কম ব্যাটারি সতর্কতা',
      'কমপ্যাক্ট, হালকা ও বহনযোগ্য স্লিম বডি'
    ],
    shortDesc: 'যেকোনো স্থানে মাত্র কয়েক সেকেন্ডে সঠিক অক্সিজেন মাত্রা ও পালস রেট পরিমাপের আধুনিক ডিভাইস।'
  },
  {
    id: 'digital-bp-monitor',
    name: 'Digital Upper Arm Blood Pressure Monitor',
    bnName: 'ডিজিটাল ব্লাড প্রেশার মনিটর',
    category: 'monitors',
    price: 2600,
    oldPrice: 3100,
    badge: 'Clinical Grade',
    rating: 4.8,
    reviews: 64,
    image: '/assets/bp_monitor.jpg',
    features: [
      'রক্তচাপ ও পালস রেট পরিমাপের জন্য সম্পূর্ণ অটোমেটিক',
      'সহজে ব্যবহারযোগ্য ওয়ান-টাচ অপারেশন',
      'বড় ডিজিটাল এলসিডি ডিসপ্লে ও মেমোরি স্টোরেজ',
      'বাড়িতে নিয়মিত রক্তচাপ পর্যবেক্ষণে নির্ভুল ফলাফল'
    ],
    shortDesc: 'সহজে বাড়িতে নিয়মিত রক্তচাপ ও হৃদস্পন্দন পর্যবেক্ষণের জন্য প্রিমিয়াম ডিজিটাল আর্ম বিপি মনিটর।'
  },
  {
    id: 'digital-thermometer',
    name: 'Rapid Digital Clinical Thermometer',
    bnName: 'ডিজিটাল ক্লিনিক্যাল থার্মোমিটার',
    category: 'monitors',
    price: 350,
    oldPrice: 450,
    badge: 'Essential',
    rating: 4.7,
    reviews: 95,
    image: '/assets/thermometer.jpg',
    features: [
      'দ্রুত ও নির্ভুল শরীরের তাপমাত্রা পরিমাপ (৬০ সেকেন্ড)',
      'ক্লিয়ার ডিজিটাল ডিসপ্লে ও বিপ এলার্ম',
      'জলরোধী ও সহজে জীবাণুমুক্তকরণ উপযোগী',
      'নিরাপদ ও মার্কারি-মুক্ত টেকসই গঠন'
    ],
    shortDesc: 'পারিবারিক প্রাথমিক চিকিৎসায় দ্রুত শরীরের তাপমাত্রা নিখুঁতভাবে মাপার নির্ভরযোগ্য থার্মোমিটার।'
  },
  {
    id: 'cpap-mask-full',
    name: 'Ergonomic Silicone CPAP Full Face Mask',
    bnName: 'সিপ্যাপ ও বাইপ্যাপ সিলিকন ফুল ফেস মাস্ক',
    category: 'masks',
    price: 5200,
    oldPrice: 6000,
    badge: 'Zero Leakage',
    rating: 4.9,
    reviews: 38,
    image: '/assets/cpap_mask.jpg',
    features: [
      'ডুয়েল-লেয়ার আল্ট্রা-সফট সিলিকন কুশন',
      'ম্যাগনেটিক ও ক্লিপ ফাস্টেনিং হেডগিয়ার স্ট্র্যাপ',
      '৩৬০ ডিগ্রি রোটেটিং এলবো কানেক্টর',
      'শান্ত ও শব্দহীন ভেন্টিলেশন এয়ার ডিফিউজার'
    ],
    shortDesc: 'কোনো দাগ বা লিকেজ ছাড়াই সারা রাত আরামদায়ক ও গভীর ঘুমের জন্য ডিজাইন করা প্রিমিয়াম মাস্ক।'
  },
  {
    id: 'corrugated-tube',
    name: 'Universal Corrugated Oxygen & CPAP Hose (1.8m)',
    bnName: 'ইউনিভার্সাল ফ্লেক্সিবল অক্সিজেন ও সিপ্যাপ টিউব',
    category: 'masks',
    price: 1200,
    oldPrice: 1500,
    badge: 'Medical Grade',
    rating: 4.8,
    reviews: 52,
    image: '/assets/breathing_tube.jpg',
    features: [
      'উচ্চমানের মেডিকেল গ্রেড ফ্লেক্সিবল পলিমার',
      'মসৃণ অভ্যন্তরীণ বোর — লো এয়ার রেজিস্ট্যান্স',
      '২২ মিমি স্ট্যান্ডার্ড কানেক্টর — সব ডিভাইসের সাথে সামঞ্জস্যপূর্ণ',
      'ক্লিনিক্যাল প্রেসার ও ওয়াটার কন্ডেনসেশন প্রতিরোধী'
    ],
    shortDesc: 'সব ধরনের সিপ্যাপ, বাইপ্যাপ ও অক্সিজেন কনসেনট্রেটরের জন্য দীর্ঘস্থায়ী ইউনিভার্সাল হোস।'
  },
  {
    id: 'cpap-care-kit',
    name: 'Complete CPAP & BiPAP Maintenance Kit',
    bnName: 'সিপ্যাপ ফুল এক্সেসরিজ ও ফিল্টার কেয়ার কিট',
    category: 'masks',
    price: 3800,
    oldPrice: 4500,
    badge: 'Bundle Savings',
    rating: 4.9,
    reviews: 29,
    image: '/assets/cpap_kit.jpg',
    features: [
      '৪ পিস আল্ট্রা-ফাইন অ্যান্টি-অ্যালার্জেন ফিল্টার',
      'প্রিমিয়াম ইলাস্টিক হেডগিয়ার ও ক্লিপস',
      'টিউব ক্লিনিং ব্রাশ ও ব্যাকটিরিয়াল ফিল্টার',
      'অক্সিজেন অ্যাডাপ্টার ও কানেক্টর'
    ],
    shortDesc: 'ডিভাইসের সঠিক কার্যক্ষমতা ও সর্বোচ্চ স্থায়িত্ব বজায় রাখতে প্রয়োজনীয় সব অ্যাক্সেসরিজের প্যাকেজ।'
  }
];

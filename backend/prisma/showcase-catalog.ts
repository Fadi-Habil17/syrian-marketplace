export type Copy = readonly [ar: string, en: string];
type Product = readonly [
  title: Copy,
  description: Copy,
  priceSyp: number,
  stock: number,
  photo: number,
];
type Offer = readonly [title: Copy, description: Copy, priceUnits: number, duration: number];

// GeoNames populated places, CC BY 4.0. These are city centers.
export const cities = {
  damascus: ['DI', 'دمشق', 'Damascus', 33.5102, 36.29128, 170654],
  aleppo: ['HL', 'حلب', 'Aleppo', 36.20124, 37.16117, 170063],
  homs: ['HI', 'حمص', 'Homs', 34.72405, 36.72559, 169577],
  latakia: ['LA', 'اللاذقية', 'Latakia', 35.53125, 35.79088, 173576],
  salamiyah: ['HM', 'السلمية', 'Salamiyah', 35.01127, 37.05324, 164947],
} as const;
export type CityKey = keyof typeof cities;

export const stores: ReadonlyArray<{
  key: string;
  name: Copy;
  description: Copy;
  city: CityKey;
  category: Copy;
  products: readonly Product[];
}> = [
  {
    key: 'ward-and-pistachio',
    city: 'damascus',
    name: ['ورد وفستق', 'Rose & Pistachio'],
    description: [
      'مطبخ حلويات في دمشق. نخبز على دفعات صغيرة ونجهّز علب للضيافة والهدايا.',
      'A Damascus pastry kitchen baking in small batches and packing gift boxes to order.',
    ],
    category: ['حلويات ومخبوزات', 'Sweets & baking'],
    products: [
      [
        ['بقلاوة بالفستق · نصف كيلو', 'Pistachio baklava · 500 g'],
        [
          'رقائق مقرمشة محشوة بالفستق، مع قطر خفيف. تُعبّأ في علبة محكمة.',
          'Crisp pastry layered with pistachios and a light syrup, packed in a sealed box.',
        ],
        98000,
        18,
        0,
      ],
      [
        ['معمول تمر · 12 قطعة', 'Date maamoul · 12 pieces'],
        [
          'عجينة سميد بالسمنة مع حشوة تمر وقرفة. مناسب مع القهوة.',
          'Semolina pastry with a date and cinnamon filling, made to serve with coffee.',
        ],
        46000,
        23,
        2,
      ],
    ],
  },
  {
    key: 'grain-and-sun',
    city: 'aleppo',
    name: ['قمح وشمس', 'Grain & Sun'],
    description: [
      'مخبوزات بيتية ومونة موسمية من حلب. بعض الأصناف بتتوفر بكميات محدودة حسب الأسبوع.',
      'Home baking and seasonal preserves from Aleppo, available in small weekly batches.',
    ],
    category: ['حلويات ومخبوزات', 'Sweets & baking'],
    products: [
      [
        ['كعك بالسمسم واليانسون', 'Sesame and anise kaak'],
        [
          'كيس 350 غرام من الكعك المقرمش، مخبوز حتى يميل لونه للذهبي.',
          'A 350 g bag of crisp golden biscuits topped with sesame.',
        ],
        28000,
        31,
        1,
      ],
      [
        ['مربّى مشمش · 320 غ', 'Apricot preserve · 320 g'],
        [
          'مربّى مشمش بقطع فاكهة واضحة ولمسة عصير ليمون.',
          'Apricot preserve with pieces of fruit and a little lemon juice.',
        ],
        32000,
        14,
        3,
      ],
    ],
  },
  {
    key: 'terrace-pantry',
    city: 'salamiyah',
    name: ['مونة التراس', 'Terrace Pantry'],
    description: [
      'مرطبانات مونة للبيت، منجهّزها بأحجام تناسب الفطور اليومي والضيافة.',
      'Pantry jars sized for everyday breakfasts and shared tables.',
    ],
    category: ['مونة وأطعمة منزلية', 'Pantry & homemade food'],
    products: [
      [
        ['مكدوس بالجوز · 550 غ', 'Walnut makdous · 550 g'],
        [
          'باذنجان صغير محشو بالجوز والفليفلة، محفوظ بالزيت.',
          'Small eggplants stuffed with walnuts and pepper, packed in oil.',
        ],
        58000,
        17,
        4,
      ],
      [
        ['كرات لبنة بالزعتر', 'Labneh balls with thyme'],
        [
          'مرطبان 300 غرام، مع زعتر وزيت. يُحفظ بالبراد بعد الاستلام.',
          'A 300 g jar of labneh with thyme and oil. Refrigerate after delivery.',
        ],
        42000,
        9,
        5,
      ],
    ],
  },
  {
    key: 'clay-and-glaze',
    city: 'damascus',
    name: ['طينة وزجاج', 'Clay & Glaze'],
    description: [
      'قطع فخار صغيرة للسفرة والشرفة، مشغولة ومطلية باليد. لكل قطعة اختلاف بسيط باللون والشكل.',
      'Small hand-glazed pieces for tables and balconies. Each piece varies slightly in color and shape.',
    ],
    category: ['فخار وديكور', 'Ceramics & decor'],
    products: [
      [
        ['فناجين قهوة مرسومة بالأزرق', 'Blue painted coffee cups'],
        [
          'طقم فنجانين فخار مع صحنين، مزخرف بالأزرق الغامق.',
          'Two hand-painted ceramic cups with matching deep-blue saucers.',
        ],
        94000,
        8,
        6,
      ],
      [
        ['أصيص فخار أبيض مع شتلة زيتون', 'White clay pot with olive sapling'],
        [
          'أصيص بفتحة تصريف، ارتفاعه 18 سم، مع شتلة زيتون صغيرة.',
          'An 18 cm pot with a drainage hole and a small olive sapling.',
        ],
        77000,
        5,
        7,
      ],
    ],
  },
  {
    key: 'bay-and-thread',
    city: 'homs',
    name: ['غار وخيط', 'Bay & Thread'],
    description: [
      'من الصابون المقطّع إيدوي لقطع التطريز. منجهّز الهدايا الصغيرة بتغليف ورقي.',
      'Hand-cut soap and embroidered objects, individually wrapped for gifting.',
    ],
    category: ['حرف وهدايا', 'Crafts & gifts'],
    products: [
      [
        ['صابون زيت الزيتون والغار', 'Olive and laurel soap'],
        [
          'ثلاث قطع صابون بدون عطر مضاف، مجففة ومغلّفة بورق.',
          'Three cured bars, paper-wrapped and made without added fragrance.',
        ],
        33500,
        44,
        8,
      ],
      [
        ['غطاء وسادة مطرّز · 40×40', 'Embroidered cushion cover · 40×40'],
        [
          'تطريز عاجي على قطن خمري، بسحاب مخفي وبدون حشوة.',
          'Ivory embroidery on burgundy cotton with a hidden zipper, cover only.',
        ],
        106000,
        7,
        9,
      ],
    ],
  },
  {
    key: 'harbor-made',
    city: 'latakia',
    name: ['صنعة المينا', 'Harbor Made'],
    description: [
      'قطع للبيت من مواد بسيطة وألوان هادئة. الشغل عالقطعة وبكميات صغيرة.',
      'Small-batch homewares made with simple materials and a quiet palette.',
    ],
    category: ['حرف وهدايا', 'Crafts & gifts'],
    products: [
      [
        ['سلة قش منسوجة', 'Handwoven straw basket'],
        [
          'سلة خفيفة بمقبضين، بتناسب الخبز أو ترتيب الأغراض اليومية.',
          'A light two-handle basket for bread or everyday storage.',
        ],
        72000,
        11,
        10,
      ],
      [
        ['شمعة شمع نحل · 120 غ', 'Beeswax candle · 120 g'],
        [
          'علبة معدنية بغطا، مع فتيل قطن ورائحة شمع خفيفة.',
          'A lidded tin with a cotton wick and the natural scent of beeswax.',
        ],
        35500,
        29,
        11,
      ],
    ],
  },
];

const trades = [
  {
    category: ['تبريد وتكييف', 'Heating & cooling'],
    photo: 12,
    offers: [
      [
        ['تنظيف مكيف سبليت', 'Split AC cleaning'],
        [
          'تنظيف الفلاتر والوحدة الداخلية وفحص تصريف المياه لمكيّف واحد.',
          'Filter and indoor unit cleaning plus a drainage check for one split unit.',
        ],
        95000,
        90,
      ],
      [
        ['فحص تكييف منزلي', 'Home AC diagnostic'],
        [
          'زيارة لفحص التبريد وتحديد سبب المشكلة. أسعار القطع بتنناقش بعد الفحص.',
          'An on-site cooling diagnostic. Replacement parts are quoted after the visit.',
        ],
        60000,
        60,
      ],
    ],
  },
  {
    category: ['سباكة وصيانة', 'Plumbing'],
    photo: 13,
    offers: [
      [
        ['معالجة تسرّب تحت المجلى', 'Under-sink leak service'],
        [
          'فحص الوصلات والسيفون وتجربة التصريف بعد الإصلاح. القطع حسب الحاجة.',
          'Inspect the trap and fittings and test drainage after the repair. Parts as needed.',
        ],
        75000,
        60,
      ],
      [
        ['تركيب خلاط مطبخ', 'Kitchen faucet installation'],
        [
          'فكّ الخلاط القديم وتركيب قطعة متوفرة عند صاحب البيت وفحص التسريب.',
          'Remove the old faucet, fit the customer-provided replacement and check for leaks.',
        ],
        115000,
        90,
      ],
    ],
  },
  {
    category: ['نجارة وتركيب', 'Carpentry'],
    photo: 14,
    offers: [
      [
        ['تركيب رفّين حائط', 'Install two wall shelves'],
        [
          'قياس وتثبيت رفّين مع اختيار البراغي حسب نوع الحائط.',
          'Measure and install two shelves with fixings appropriate for the wall.',
        ],
        120000,
        90,
      ],
      [
        ['ضبط أبواب خزانة', 'Cabinet door adjustment'],
        [
          'تثبيت المفصلات وضبط الإغلاق لحد أربعة أبواب.',
          'Tighten hinges and adjust up to four cabinet doors.',
        ],
        78000,
        60,
      ],
    ],
  },
  {
    category: ['كهرباء وإنارة', 'Electrical & lighting'],
    photo: 15,
    offers: [
      [
        ['تركيب وحدتي إنارة', 'Install two light fixtures'],
        [
          'تركيب وحدتين متوفرتين بالموقع على نقاط كهرباء جاهزة وفحص التشغيل.',
          'Fit two customer-provided fixtures to existing connections and test operation.',
        ],
        105000,
        90,
      ],
      [
        ['فحص عطل إنارة', 'Lighting fault check'],
        [
          'تحديد سبب العطل وفحص القاطع والمفتاح ونقطة الإنارة.',
          'Diagnose one lighting fault and check the circuit breaker, switch and fixture.',
        ],
        64000,
        60,
      ],
    ],
  },
] as const satisfies ReadonlyArray<{ category: Copy; photo: number; offers: readonly Offer[] }>;

export const professionals = (
  [
    ['breeze-service', 'نسمة للتكييف', 'damascus', 0, 8],
    ['cedar-plumbing', 'وصلة الأرز', 'salamiyah', 1, 11],
    ['fig-workshop', 'ورشة خشب وتين', 'aleppo', 2, 14],
    ['lamp-service', 'مفتاح ونور', 'homs', 3, 9],
    ['coast-air', 'هوى الساحل', 'latakia', 0, 10],
    ['olive-fittings', 'مسار الزيتون للصيانة', 'damascus', 1, 7],
    ['woodline', 'خطّ خشب', 'salamiyah', 2, 12],
    ['copper-circuit', 'سلك ونحاس', 'aleppo', 3, 8],
  ] as const
).map(([key, name, city, trade, years]) => ({ key, name, city, years, ...trades[trade] }));

export const freelancers: ReadonlyArray<{
  key: string;
  name: string;
  city: CityKey;
  category: Copy;
  photo: number;
  offers: readonly Offer[];
}> = [
  {
    key: 'fig-identity',
    name: 'مرسم ورق التين',
    city: 'damascus',
    category: ['تصميم وهوية بصرية', 'Brand & graphic design'],
    photo: 16,
    offers: [
      [
        ['هوية بصرية لمشروع صغير', 'Brand identity for a small business'],
        [
          'شعار أساسي وثانوي، لوحة ألوان ودليل استخدام مختصر. يشمل جولتي تعديل.',
          'Primary and secondary logos, a color palette and a short brand guide with two revisions.',
        ],
        11500,
        9,
      ],
      [
        ['تصميم تغليف منتج', 'Product packaging design'],
        [
          'تصميم واجهة وظهر لعبوة واحدة مع ملف جاهز للطباعة.',
          'Front and back design for one package, with print-ready artwork.',
        ],
        5800,
        5,
      ],
    ],
  },
  {
    key: 'street-digital',
    name: 'ستوديو خط الحارة',
    city: 'aleppo',
    category: ['ويب وواجهات رقمية', 'Web & digital design'],
    photo: 17,
    offers: [
      [
        ['تصميم صفحة هبوط عربية', 'Arabic landing page design'],
        [
          'تصميم نسخة موبايل وكمبيوتر مع ملف Figma منظم، لحد خمس أقسام.',
          'A desktop and mobile Figma design for an Arabic landing page, up to five sections.',
        ],
        8200,
        7,
      ],
      [
        ['مراجعة واجهة متجر إلكتروني', 'Online store UX review'],
        [
          'مراجعة التنقل والبحث والشراء مع ملاحظات مصوّرة وخطوات إصلاح مرتبة.',
          'An annotated review of browsing, search and checkout with prioritized fixes.',
        ],
        4400,
        4,
      ],
    ],
  },
  {
    key: 'window-studio',
    name: 'استوديو ضوّ الشباك',
    city: 'latakia',
    category: ['تصوير ومحتوى', 'Photography & content'],
    photo: 18,
    offers: [
      [
        ['تصوير ستة منتجات', 'Six-product photo session'],
        [
          'خلفية محايدة وصورتان معدّلتان لكل قطعة، مع مقاسات للمتجر والسوشال.',
          'Two retouched photos per item on a neutral background, sized for stores and social posts.',
        ],
        7200,
        6,
      ],
      [
        ['معالجة صور للكتالوج', 'Catalog photo retouching'],
        [
          'تعديل الألوان والإضاءة وقصّ 12 صورة بخلفية موحّدة.',
          'Color, lighting and crop correction for 12 catalog photographs.',
        ],
        3600,
        3,
      ],
    ],
  },
  {
    key: 'line-and-meaning',
    name: 'سطر ومعنى',
    city: 'homs',
    category: ['ترجمة وتحرير', 'Translation & editing'],
    photo: 19,
    offers: [
      [
        ['ترجمة محتوى متجر', 'Online store translation'],
        [
          'ترجمة 1000 كلمة بين العربية والإنكليزية مع مراجعة الأسلوب والمصطلحات.',
          'Translate up to 1,000 words between Arabic and English, with terminology and style review.',
        ],
        4200,
        4,
      ],
      [
        ['تحرير أوصاف منتجات', 'Product description editing'],
        [
          'تحرير عشرة أوصاف، مع مراجعة الطول وتوحيد نبرة الكتابة.',
          'Edit ten product descriptions for length, clarity and a consistent voice.',
        ],
        3100,
        3,
      ],
    ],
  },
];

export const buyerNames = [
  'لمى ق.',
  'نور ح.',
  'كريم ن.',
  'ربى م.',
  'غيث س.',
  'لين ع.',
  'رامي د.',
  'مرح ك.',
  'وسيم ل.',
  'هبة ج.',
  'جود ت.',
  'ميس خ.',
  'ياسر ر.',
  'دانا ب.',
  'عمر ف.',
  'سمر ش.',
  'Lina M.',
  'Rana S.',
  'Adam N.',
  'Maya A.',
  'Rami K.',
  'Sara D.',
  'Khaled T.',
  'Nadine B.',
];

export const reviewText = {
  HOME_STORE: [
    'وصل الطلب مرتب والتغليف ظلّ ثابت بالطريق. رح أطلب مرة تانية.',
    'الوصف كان دقيق، وحبيت إنهم خبروني قبل ما يطلع الطلب.',
    'جهزوا الطلب عالوقت المتفق عليه. مناسب جداً إذا بدكن هدية.',
    'كنت متوقعة الحجم أكبر شوي، بس الشغل مرتب والخامة منيحة.',
    'سألت عن التفاصيل قبل ما أطلب، وكان الرد سريع وواضح.',
    'Packaging was tidy and the order matched the photos.',
    'كان في تأخير بسيط بالتوصيل. تواصلوا معي وغيّرنا الوقت بسهولة.',
    'الطلب من تاني مرة بنفس الجودة. شكراً عالاهتمام بالتفاصيل.',
    'Everything arrived intact. I appreciated the delivery update.',
    'اختيار حلو للضيافة. رح جرّب شي تاني من نفس المتجر.',
  ],
  PROFESSIONALS: [
    'إجا بالموعد وحدّد سبب المشكلة قبل ما يبدأ. ترك المكان مرتب.',
    'شرحلي شو لازم يتغيّر وشو ممكن يضلّ متل ما هو.',
    'التنسيق كان سهل والسعر اتوضح قبل ما يبلّش الشغل.',
    'اتأخر شوي عن الموعد بس خبرني مسبقاً. النتيجة منيحة.',
    'جرّب الشغل قدامي بعد ما خلّص وشرحلي كيف أتابع إذا رجعت المشكلة.',
    'Clear scheduling and a tidy finish. The scope matched what we agreed.',
    'كان لازم زيارة متابعة بسيطة، وتم ترتيبها بسرعة.',
    'الشغل متقن وما احتجت أتواصل مرة ثانية.',
    'Arrived on time and explained the work before getting started.',
    'أخذ وقت أكتر من المتوقع، بس كانت النتيجة مرتبة.',
  ],
  FREELANCE: [
    'فهم المطلوب من البداية وبعت نسخة أولى قبل الموعد.',
    'الملفات النهائية منظمة وسهل أرجع عدّل عليها.',
    'التعديلات كانت واضحة ومحددة، والتواصل خلال الشغل ممتاز.',
    'النسخة الأولى ما ناسبتني كتير، بس عدّلها بسرعة وباهتمام.',
    'سلّم كل المقاسات اللي طلبتها مع توضيح لكل ملف.',
    'Well-organized delivery and quick responses to feedback.',
    'أخدنا يوم زيادة على الموعد لنتفق عالتفاصيل. النتيجة عجبتني.',
    'أرسل خيارين مختلفين وساعدني أختار الأنسب.',
    'The final work was easy to reuse. I would work with them again.',
    'شرح الخطوات من البداية وبعت تحديثات طول فترة الشغل.',
  ],
} as const;

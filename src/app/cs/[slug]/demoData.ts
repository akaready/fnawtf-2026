import type { CallSheetData } from '@/components/callsheet/types';

export const demoCallSheet: CallSheetData = {
  id: 'demo',
  jobId: 'COM0100',
  projectTitle: '\u201CRoam\u201D',
  projectType: 'Advert',
  projectThumbnail: null,
  shootDay: 2,
  totalDays: 3,
  date: '2026-03-12',
  callTime: '8:00 AM',
  safetyNote:
    'Silence phones, use designated walkie channels, and follow all safety guidelines.',

  production: {
    companyName: 'Volvo Cars USA',
    companyLogo: '/images/clients/volvo.png',
    companyAddress: '1800 Volvo Place, Mahwah, NJ 07430',
    companyPhone: '(800) 458-1552',
    keyCrew: [
      { role: 'Director', name: 'Jake Johnson', headshot: null },
      { role: 'Executive Producer', name: 'Ready Freddie', headshot: '/images/about/ready.jpg' },
      { role: 'Producer', name: 'Richie Khanna', headshot: '/images/about/richie.jpg' },
    ],
  },

  weather: {
    condition: 'sunny',
    description: 'Mostly sunny throughout the day',
    tempHigh: 74,
    tempLow: 52,
    sunrise: '6:12am',
    sunset: '6:45pm',
  },

  schedule: {
    crewCall: '8:00 AM',
    talentCall: '9:00 AM',
    shootingCall: '10:00 AM',
    lunch: '12:00 PM',
    estimatedWrap: '5:00 PM',
    custom: [],
  },

  bulletins: [
    {
      id: 'b1',
      text: 'Crew parking garage is in Structure #4. Please follow the signs. If you must unload equipment, there\'s an unloading area in the alley behind the building. The small lot in the front is reserved lead cast and executives only. Thank you!',
      pinned: true,
    },
  ],

  locations: {
    set: {
      name: 'Topanga Ranch',
      address: '321 Topanga Canyon Dr, Topanga, CA 91303',
      phone: '(888) 553-8782',
      note: 'Let the guard know the project title for a map to set.',
      mapsUrl: 'https://maps.google.com/?q=321+Topanga+Canyon+Dr+Topanga+CA+91303',
    },
    parking: {
      name: 'Topanga Ranch — Stage 4',
      address: '321 Topanga Canyon Dr, Topanga, CA 91303',
      phone: '(888) 553-8782',
      note: 'Parking lot is in front of the set. Follow signs for crew parking.',
      mapsUrl: 'https://maps.google.com/?q=321+Topanga+Canyon+Dr+Topanga+CA+91303',
    },
    hospital: {
      name: 'Kaiser Permanente Medical Center',
      address: '5601 De Soto Ave, Woodland Hills, CA 91367',
      phone: '(833) 574-2273',
      note: null,
      mapsUrl:
        'https://maps.google.com/?q=5601+De+Soto+Ave+Woodland+Hills+CA+91367',
    },
  },

  cast: [
    {
      id: 1,
      name: 'Kat Bayer',
      role: 'Jen',
      headshot: 'https://i.pravatar.cc/150?u=kat-bayer',
      status: 'W',
      pickup: '7:10 AM',
      callTime: '8:00 AM',
      hmua: '8:30 AM',
      onSet: '9:00 AM',
      wrap: '5:00 PM',
    },
    {
      id: 2,
      name: 'Kevin Hawkins',
      role: 'Paul',
      headshot: 'https://i.pravatar.cc/150?u=kevin-hawkins',
      status: 'W',
      pickup: '1:00 PM',
      callTime: '1:30 PM',
      hmua: '1:45 PM',
      onSet: '2:00 PM',
      wrap: '5:00 PM',
    },
    {
      id: 3,
      name: 'Mia Chen',
      role: 'Narrator (V.O.)',
      headshot: 'https://i.pravatar.cc/150?u=mia-chen',
      status: 'SWF',
      pickup: null,
      callTime: '10:00 AM',
      hmua: null,
      onSet: '10:30 AM',
      wrap: '12:00 PM',
    },
  ],

  crew: [
    {
      name: 'Jake Johnson',
      title: 'Director',
      phone: '(310) 555-0101',
      email: 'jake@helixvisuals.com',
      callTime: '7:00 AM',
      wrap: '6:00 PM',
    },
    {
      name: 'Joy Tillery',
      title: '1st AD',
      phone: '(310) 555-0102',
      email: 'joy@helixvisuals.com',
      callTime: '6:30 AM',
      wrap: '6:00 PM',
    },
    {
      name: 'Bill McKinney',
      title: 'Director of Photography',
      phone: '(310) 555-0201',
      email: 'bill.mckinney@gmail.com',
      callTime: '7:30 AM',
      wrap: '5:30 PM',
    },
    {
      name: 'Leah Park',
      title: 'A Cam Operator',
      phone: '(310) 555-0202',
      email: 'leah.park@gmail.com',
      callTime: '7:30 AM',
      wrap: '5:30 PM',
    },
    {
      name: 'John Yates',
      title: 'Sound Mixer',
      phone: '(310) 555-0301',
      email: 'john.yates@soundpro.com',
      callTime: '7:30 AM',
      wrap: '5:00 PM',
    },
    {
      name: 'William Jimenez',
      title: 'Key Grip',
      phone: '(310) 555-0401',
      email: 'will.j@griphouse.com',
      callTime: '6:45 AM',
      wrap: '5:30 PM',
    },
    {
      name: 'Peter Galloway',
      title: 'Gaffer',
      phone: '(310) 555-0402',
      email: 'peter.g@lightworks.com',
      callTime: '6:45 AM',
      wrap: '5:30 PM',
    },
    {
      name: 'Maria Sandoval',
      title: 'Production Assistant',
      phone: '(310) 555-0103',
      email: 'maria.s@helixvisuals.com',
      callTime: '6:30 AM',
      wrap: '6:30 PM',
    },
  ],

  specialInstructions: [
    {
      category: 'CAMERA',
      notes:
        'RED V-RAPTOR 8K (A-cam) + KOMODO-X (B-cam) with wide primes, auto zooms, polarizers, NDs, and Ronin 2 for vehicle motion shots.',
    },
    {
      category: 'LIGHTING',
      notes:
        'Aputure 600D/1200D with HMIs for long punches, lightweight LED mats, reflectors, and full negative fill for exterior contrast.',
    },
    {
      category: 'GRIP',
      notes:
        'Car-mount kit with suction rigs, hostess tray, safety cables, tracking vehicle support, and 12x12 diffusion for shaping.',
    },
    {
      category: 'PRODUCTION DESIGN',
      notes:
        'Roam Truck cleaned and continuity-checked; interior minimally dressed with approved hero props and dust/wear applied as needed.',
    },
    {
      category: 'SOUND',
      notes:
        'Lavs and boom with heavy wind protection, car-cabin plant mics, and clean engine/exhaust sound pass scheduled.',
    },
  ],

  scenes: [
    {
      sceneId: '4',
      description: 'Jen discovers the truck at dawn, walks around it slowly',
      intExt: 'EXT',
      location: 'Ranch Hilltop',
      timeOfDay: 'DAWN',
      cast: [1],
      estimatedStart: '6:45 AM',
      estimatedEnd: '8:15 AM',
      notes: 'Golden hour — must start by 6:45am',
    },
    {
      sceneId: '5A',
      description: 'Jen and Paul drive through canyon roads, conversation about leaving the city',
      intExt: 'EXT/INT',
      location: 'Canyon Road',
      timeOfDay: 'DAY',
      cast: [1, 2],
      estimatedStart: '10:00 AM',
      estimatedEnd: '12:00 PM',
      notes: 'Car-mount shots — tracking vehicle required',
    },
    {
      sceneId: '5B',
      description: 'Driving montage — wide aerials and close-ups of terrain',
      intExt: 'EXT',
      location: 'Canyon Road',
      timeOfDay: 'DAY',
      cast: [],
      estimatedStart: '12:30 PM',
      estimatedEnd: '1:30 PM',
      notes: null,
    },
    {
      sceneId: '7',
      description: 'Narrator V.O. recording — "The road doesn\'t ask where you\'ve been"',
      intExt: 'INT',
      location: 'Sound Booth (On-Site)',
      timeOfDay: 'DAY',
      cast: [3],
      estimatedStart: '10:00 AM',
      estimatedEnd: '11:00 AM',
      notes: 'Isolated quiet set needed',
    },
    {
      sceneId: '9',
      description: 'Sunset arrival at campsite, Jen parks and steps out',
      intExt: 'EXT',
      location: 'Campsite Clearing',
      timeOfDay: 'DUSK',
      cast: [1],
      estimatedStart: '4:30 PM',
      estimatedEnd: '5:30 PM',
      notes: 'Magic hour — backup coverage if clouds',
    },
  ],

  vendors: [
    {
      name: 'Reel Catering Co.',
      role: 'Craft Services & Catering',
      phone: '(818) 555-0900',
      contact: 'Diana Torres',
    },
    {
      name: 'Panavision Hollywood',
      role: 'Camera & Lens Rental',
      phone: '(323) 555-0800',
      contact: 'Marcus Webb',
    },
    {
      name: 'Cinelease',
      role: 'Grip & Lighting',
      phone: '(818) 555-0700',
      contact: null,
    },
  ],
};

// Centralized Amharic strings for TicketWin
export const t = {
  appName: "ቲኬት ዊን",
  tagline: "የኢትዮጵያ #1 የመስመር ላይ ዕጣ መድረክ",
  // Nav
  home: "ዋና ገጽ",
  myTickets: "የእኔ ቲኬቶች",
  dashboard: "ዳሽቦርድ",
  login: "ግባ",
  register: "ተመዝገብ",
  logout: "ውጣ",
  admin: "አስተዳዳሪ",
  // Common
  loading: "በመጫን ላይ...",
  save: "አስቀምጥ",
  cancel: "ሰርዝ",
  submit: "ላክ",
  edit: "አስተካክል",
  delete: "ሰርዝ",
  view: "ይመልከቱ",
  back: "ተመለስ",
  next: "ቀጥል",
  search: "ፈልግ",
  required: "ይህ መስክ ያስፈልጋል",
  // Auth
  fullName: "ሙሉ ስም",
  phone: "ስልክ ቁጥር",
  email: "ኢሜይል",
  password: "የይለፍ ቃል",
  confirmPassword: "የይለፍ ቃል አረጋግጥ",
  forgotPassword: "የይለፍ ቃል ረሱ?",
  signIn: "ግባ",
  signUp: "ተመዝገብ",
  alreadyHaveAccount: "አካውንት አለዎት?",
  noAccount: "አካውንት የለዎትም?",
  // Games
  activeGames: "ንቁ ጨዋታዎች",
  buyTicket: "ቲኬት ግዛ",
  ticketPrice: "የቲኬት ዋጋ",
  prize: "ሽልማት",
  ticketsSold: "የተሸጡ ቲኬቶች",
  totalTickets: "ጠቅላላ ቲኬቶች",
  timeRemaining: "የቀረው ጊዜ",
  description: "መግለጫ",
  // Purchase
  paymentInstructions: "የክፍያ መመሪያ",
  sendExactly: "በትክክል ይላኩ",
  accountName: "የአካውንት ስም",
  accountNumber: "የአካውንት ቁጥር",
  bank: "ባንክ",
  selectBank: "ባንክ ይምረጡ",
  referenceNumber: "የግብይት መለያ ቁጥር",
  accountSuffix: "የመጨረሻ 8 አሃዞች",
  phoneNumber: "ስልክ ቁጥር",
  uploadReceipt: "ደረሰኝ ጫን (አማራጭ)",
  confirmPurchase: "ግዢውን አረጋግጥ",
  // Status
  pending: "በመጠባበቅ ላይ",
  verified: "ተረጋግጧል",
  rejected: "ተቀባይነት የለውም",
  paymentUploaded: "ክፍያ ተጭኗል",
  // Admin
  manageGames: "ጨዋታዎችን አስተዳድር",
  managePlayers: "ተጫዋቾችን አስተዳድር",
  totalRevenue: "ጠቅላላ ገቢ",
  totalGames: "ጠቅላላ ጨዋታዎች",
  pendingVerifications: "ለማረጋገጥ የተጠባበቁ",
  createGame: "አዲስ ጨዋታ ፍጠር",
  drawWinner: "አሸናፊ ምረጥ",
  verify: "አረጋግጥ",
  reject: "አትቀበል",
  // Misc
  welcome: "እንኳን ደህና መጡ",
  about: "ስለ እኛ",
  howItWorks: "እንዴት ይሰራል",
  terms: "ውሎች",
  contact: "አግኙን",
  winner: "አሸናፊ",
  ticketNumber: "የቲኬት ቁጥር",
  noData: "መረጃ የለም",
  congratulations: "እንኳን ደስ አለዎት!",
  yourTicketNumber: "የእርስዎ የቲኬት ቁጥር",
  paymentVerifying: "ክፍያዎን በማረጋገጥ ላይ...",
  paymentSuccess: "ክፍያዎ ተረጋግጧል!",
  paymentPending: "ክፍያዎን በራስ-ሰር ማረጋገጥ አልተቻለም። አስተዳዳሪ በቅርቡ ይገመግማል።",
  draftStatus: "ረቂቅ",
  activeStatus: "ንቁ",
  closedStatus: "ተዘግቷል",
  completedStatus: "ተጠናቋል",
};

export const banks = [
  { value: "CBE", label: "ንግድ ባንክ (CBE)" },
  { value: "Telebirr", label: "ቴሌብር" },
  { value: "Dashen", label: "ዳሸን ባንክ" },
  { value: "Abyssinia", label: "አቢሲኒያ ባንክ" },
  { value: "CBEBirr", label: "ሲቢኢ ብር" },
  { value: "MPesa", label: "ኤም-ፔሳ" },
];

export const formatETB = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0);
  return `${v.toLocaleString("en-US", { maximumFractionDigits: 2 })} ብር`;
};

// Convert Ethiopian phone (09xxxxxxxx) to a synthetic email for Supabase auth
export const phoneToEmail = (phone: string) => {
  const clean = phone.replace(/\D/g, "");
  return `${clean}@ticketwin.local`;
};

export const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

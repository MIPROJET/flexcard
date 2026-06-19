export type Operator = "MTN" | "Orange" | "Moov" | "Fixe" | "Inconnu";

export type Phone = { number: string; operator: Operator };

export type GalleryItem = {
  id: string;
  category: "photos" | "affiches" | "visuels" | "videos" | "actualites";
  url?: string;
  /** "image" | "video" — pour la galerie médias */
  mediaType?: "image" | "video";
  caption?: string;
  text?: string; // for actualites
  createdAt: number;
};

export type SocialLinks = {
  whatsapp?: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
};

export type AccountKind =
  | "particulier"
  | "informel"
  | "entreprise"
  | "coordinateur"
  | "commercial"
  | "partenaire";

export type Plan =
  | "free"
  | "vocal"
  | "starter"
  | "pro_particulier"
  | "team10"
  | "team20"
  | "team50"
  | "team100"
  | "unlimited";

export type UserRole = "user" | "admin" | "coordinator" | "commercial" | "partner";
export type PayoutMethod = "wave" | "orange_money" | "mtn_momo";

export type Profile = {
  id: string;
  slug: string; // public URL
  email: string;
  kind: AccountKind;
  // entreprise: liens vers organisation
  orgId?: string;
  // identité
  firstName: string;
  lastName: string;
  title: string;
  company?: string;
  sector: string;
  description?: string; // 580 max
  avatarUrl?: string;
  coverUrl?: string;
  /** Type de couverture : image (par défaut) ou vidéo (max 30s, 100Mo, lecture en boucle). */
  coverType?: "image" | "video";
  phones: Phone[];
  publicEmail?: string;
  website?: string;
  city?: string;
  socials: SocialLinks;
  gallery: GalleryItem[];
  templateId: string;
  palette: { primary: string; accent: string; ink: string };
  hasPremium: boolean;
  premiumCode?: string;
  boostUntil?: number;
  prospects: ProspectLink[];
  createdAt: number;
  // CDC V4 — rôles & commissions
  role?: UserRole;
  managedAgentIds?: string[];     // pour coordinateur
  commissionRate?: number;        // pour partenaire/commercial (0–1)
  payoutMethod?: PayoutMethod;
  payoutAccount?: string;         // numéro Wave/OM/MOMO
};

export type ProspectLink = {
  // numéro (ou email) du téléphone scanneur
  phone: string;
  contactName?: string;
  email?: string;
  firstScanAt: number;
  visits: number;
  lastVisitAt: number;
};

export type Organization = {
  id: string;
  name: string;
  sector: string;
  logoUrl?: string;
  plan: Plan;
  hasPremiumPack: boolean;
  premiumCode?: string;
  ownerEmail: string;
  memberIds: string[];
  createdAt: number;
};

export type AppState = {
  profiles: Record<string, Profile>;
  organizations: Record<string, Organization>;
  currentProfileId: string | null;
  // OTP en attente
  pendingEmail: string | null;
};

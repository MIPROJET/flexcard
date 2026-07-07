import { createFileRoute, Link } from "@tanstack/react-router";
import { useProfileBySlug, useApp } from "@/lib/mock/store";
import { BusinessCard } from "@/components/flex/BusinessCard";
import { Logo } from "@/components/flex/Logo";
import {
  Download, Save, Share2, ImagePlus, Megaphone, Newspaper,
  Phone, MessageCircle, Mail, Globe, QrCode as QrIcon, Linkedin, Instagram, Facebook,
} from "lucide-react";
import { PhoneInput } from "@/components/flex/PhoneInput";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import logoAsset from "@/assets/flexcard-logo.png.asset.json";
import { safeHttpUrl, vcardEscape } from "@/lib/safe";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/c/$slug")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — FlexCard` },
      { name: "description", content: "Carte de visite digitale FlexCard." },
      { property: "og:title", content: `${params.slug} sur FlexCard` },
      { property: "og:description", content: "Une carte. Mille connexions." },
    ],
  }),
  component: PublicCardPage,
});

function buildVCard(p: any): string {
  const safeWebsite = safeHttpUrl(p.website);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${vcardEscape(p.lastName)};${vcardEscape(p.firstName)};;;`,
    `FN:${vcardEscape(`${p.firstName} ${p.lastName}`)}`,
    p.title ? `TITLE:${vcardEscape(p.title)}` : "",
    p.company ? `ORG:${vcardEscape(p.company)}` : "",
    ...p.phones.map((ph: any) => `TEL;TYPE=cell:${vcardEscape(ph.number.replace(/\s/g, ""))}`),
    p.publicEmail ? `EMAIL;TYPE=INTERNET:${vcardEscape(p.publicEmail)}` : "",
    safeWebsite ? `URL:${vcardEscape(safeWebsite)}` : "",
    p.city ? `ADR;TYPE=WORK:;;;${vcardEscape(p.city)};;;` : "",
    `NOTE:${vcardEscape((p.description ?? "").slice(0, 240))}`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function PublicCardPage() {
  const { slug } = Route.useParams();
  const mockProfile = useProfileBySlug(slug);
  const [dbProfile, setDbProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const recordScan = useApp((s) => s.recordScan);
  const [linkOpen, setLinkOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [linkPhone, setLinkPhone] = useState("");
  const [linkName, setLinkName] = useState("");

  // Charge le profil depuis Supabase ; fallback au mock si absent
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, slug, first_name, last_name, title, company, sector, description, avatar_url, cover_url, cover_type, public_email, website, city, socials, palette, has_premium, template_id")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        // Récupère les téléphones
        const { data: phones } = await supabase
          .from("phones")
          .select("number, operator")
          .eq("profile_id", data.id);
        // Récupère la galerie
        const { data: gallery } = await supabase
          .from("gallery")
          .select("id, category, url, media_type, caption, text_content, created_at")
          .eq("profile_id", data.id)
          .order("created_at", { ascending: false });
        setDbProfile({
          id: data.id,
          slug: data.slug,
          firstName: data.first_name,
          lastName: data.last_name,
          title: data.title ?? "",
          company: data.company ?? "",
          sector: data.sector ?? "",
          description: data.description ?? "",
          avatarUrl: data.avatar_url ?? undefined,
          coverUrl: data.cover_url ?? undefined,
          coverType: (data.cover_type as any) ?? "image",
          publicEmail: data.public_email ?? "",
          website: data.website ?? "",
          city: data.city ?? "",
          socials: (data.socials as any) ?? {},
          palette: (data.palette as any) ?? { primary: "#0066FF", accent: "#FF6B00", ink: "#0B1220" },
          hasPremium: !!data.has_premium,
          templateId: data.template_id ?? "neon",
          phones: (phones ?? []).map((p: any) => ({ number: p.number, operator: p.operator })),
          gallery: (gallery ?? []).map((g: any) => ({
            id: g.id, category: g.category, url: g.url ?? undefined,
            mediaType: g.media_type ?? undefined, caption: g.caption ?? undefined,
            text: g.text_content ?? undefined, createdAt: new Date(g.created_at).getTime(),
          })),
          prospects: [],
          email: "", kind: "particulier", createdAt: Date.now(),
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const profile: any = dbProfile ?? mockProfile;

  if (loading && !mockProfile) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground">Chargement de la carte…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <Logo className="h-10 mb-6" />
        <h1 className="text-2xl font-bold">Profil introuvable</h1>
        <p className="text-muted-foreground mt-2">Le slug « {slug} » n'existe pas.</p>
        <Link to="/" className="mt-6 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow">Accueil</Link>
      </div>
    );
  }

  const cardUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${profile.slug}` : "";
  const tel = profile.phones[0]?.number.replace(/\s/g, "");
  const wa = profile.socials.whatsapp?.replace(/\D/g, "") || (tel?.replace(/\D/g, ""));

  const photos = profile.gallery.filter((g: any) => g.category === "photos");
  const affiches = profile.gallery.filter((g: any) => g.category === "affiches");
  const visuels = profile.gallery.filter((g: any) => g.category === "visuels");
  const videos = profile.gallery.filter((g: any) => g.category === "videos");
  const news = profile.gallery.filter((g: any) => g.category === "actualites");

  const downloadVCard = () => {
    const blob = new Blob([buildVCard(profile)], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${profile.slug}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contact téléchargé", { description: "Ouvre le fichier pour l'ajouter à tes contacts." });
  };

  const share = async () => {
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: `${profile.firstName} ${profile.lastName}`, text: profile.title, url: cardUrl }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(cardUrl); toast.success("Lien copié"); } catch { toast.error("Impossible de partager"); }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh pb-16">
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/"><Logo className="h-7" /></Link>
          <button
            onClick={() => setLinkOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow"
          >
            <Save className="h-3.5 w-3.5" /> Enregistrer
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <BusinessCard profile={profile} variant="full" />

        {/* Action bar */}
        <div className="surface-elevated p-4">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
            {tel && <ActionBtn href={`tel:${tel}`} label="Appel" icon={<Phone className="h-5 w-5" />} color={profile.palette.primary} />}
            {wa && <ActionBtn href={`https://wa.me/${wa}`} label="WhatsApp" icon={<MessageCircle className="h-5 w-5" />} color="#25D366" />}
            {profile.publicEmail && <ActionBtn href={`mailto:${profile.publicEmail}`} label="Email" icon={<Mail className="h-5 w-5" />} color={profile.palette.ink} />}
            {safeHttpUrl(profile.website) && <ActionBtn href={safeHttpUrl(profile.website)!} label="Web" icon={<Globe className="h-5 w-5" />} color={profile.palette.accent} />}
            {profile.socials.linkedin && <ActionBtn href={`https://linkedin.com/in/${profile.socials.linkedin}`} label="LinkedIn" icon={<Linkedin className="h-5 w-5" />} color="#0A66C2" />}
            {profile.socials.instagram && <ActionBtn href={`https://instagram.com/${profile.socials.instagram}`} label="Insta" icon={<Instagram className="h-5 w-5" />} color="#E1306C" />}
            {profile.socials.facebook && <ActionBtn href={`https://facebook.com/${profile.socials.facebook}`} label="Facebook" icon={<Facebook className="h-5 w-5" />} color="#1877F2" />}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button onClick={downloadVCard} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold hover:bg-secondary">
              <Download className="h-3.5 w-3.5" /> vCard
            </button>
            <button onClick={() => setQrOpen(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold hover:bg-secondary">
              <QrIcon className="h-3.5 w-3.5" /> QR Code
            </button>
            <button onClick={share} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-brand px-3 py-2.5 text-xs font-semibold text-white shadow-glow">
              <Share2 className="h-3.5 w-3.5" /> Partager
            </button>
          </div>
        </div>

        {photos.length > 0 && <GallerySection title="Photos" icon={<ImagePlus className="h-4 w-4" />} items={photos} />}
        {affiches.length > 0 && <GallerySection title="Affiches" icon={<Megaphone className="h-4 w-4" />} items={affiches} />}
        {visuels.length > 0 && <GallerySection title="Visuels" icon={<ImagePlus className="h-4 w-4" />} items={visuels} />}
        {videos.length > 0 && <GallerySection title="Vidéos" icon={<ImagePlus className="h-4 w-4" />} items={videos} />}

        {news.length > 0 && (
          <section className="surface-elevated p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Newspaper className="h-4 w-4" /> Actualités
            </h3>
            <ul className="mt-4 space-y-3">
              {news.map((n: any) => (
                <li key={n.id} className="rounded-xl bg-secondary/60 p-3 text-sm">{n.text}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex items-center justify-center gap-3 pt-4 text-xs text-muted-foreground">
          <Share2 className="h-3.5 w-3.5" /> Carte synchronisée en temps réel via FlexCard
        </div>
      </div>

      {/* QR modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setQrOpen(false)}>
          <div className="w-full max-w-sm surface-elevated p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Scanne ma carte</h3>
            <p className="mt-1 text-xs text-muted-foreground">QR haute résistance · Niveau H</p>
            <div className="relative mx-auto mt-5 inline-block rounded-2xl bg-white p-4 ring-1 ring-border">
              <QRCodeSVG value={cardUrl} size={220} level="H" fgColor={profile.palette.ink} bgColor="#ffffff" imageSettings={{ src: logoAsset.url, height: 44, width: 44, excavate: true }} />
            </div>
            <p className="mt-3 break-all text-xs text-muted-foreground">{cardUrl}</p>
            <button onClick={() => setQrOpen(false)} className="mt-5 w-full rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow">Fermer</button>
          </div>
        </div>
      )}

      {linkOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setLinkOpen(false)}>
          <div className="w-full max-w-md surface-elevated p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Enregistrer ce contact</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Indique ton numéro pour créer le lien d'annuaire automatique.
            </p>
            <div className="mt-5 space-y-3">
              <input
                value={linkName} onChange={(e) => setLinkName(e.target.value)}
                placeholder="Ton nom (optionnel)"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
              />
              <PhoneInput value={linkPhone} onChange={setLinkPhone} placeholder="07 12 34 56 78" />
              <button
                onClick={() => {
                  if (linkPhone.length < 6) { toast.error("Numéro invalide"); return; }
                  recordScan(profile.id, linkPhone, linkName || undefined);
                  downloadVCard();
                  toast.success("Contact enregistré !", { description: "Tu apparais maintenant dans son annuaire de prospects." });
                  setLinkOpen(false);
                }}
                className="w-full rounded-xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow"
              >
                Enregistrer dans mon téléphone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ href, label, icon, color }: { href: string; label: string; icon: React.ReactNode; color: string }) {
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex flex-col items-center gap-1.5 group">
      <span className="grid h-12 w-12 place-items-center rounded-full text-white shadow-md transition group-hover:scale-110" style={{ background: color }}>
        {icon}
      </span>
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
    </a>
  );
}

function GallerySection({ title, icon, items }: { title: string; icon: React.ReactNode; items: { id: string; url?: string; caption?: string }[] }) {
  return (
    <section className="surface-elevated p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((g) => (
          <div key={g.id} className="aspect-square overflow-hidden rounded-xl bg-secondary">
            {g.url ? <img src={g.url} alt={g.caption || ""} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">visuel</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

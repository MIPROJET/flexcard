import { createFileRoute } from "@tanstack/react-router";
import { useApp, useCurrentProfile } from "@/lib/mock/store";
import { useRef, useState } from "react";
import { Plus, Trash2, Image as ImageIcon, Megaphone, PaintBucket, Video, Newspaper, Upload } from "lucide-react";
import type { GalleryItem } from "@/lib/mock/types";
import { toast } from "sonner";

const CATS = [
  { id: "photos", label: "Photos", icon: ImageIcon, freeMax: 6, accept: "image/*", isVideo: false },
  { id: "affiches", label: "Affiches", icon: Megaphone, freeMax: 3, accept: "image/*", isVideo: false },
  { id: "visuels", label: "Visuels", icon: PaintBucket, freeMax: 3, accept: "image/*", isVideo: false },
  { id: "videos", label: "Vidéos", icon: Video, freeMax: 2, accept: "video/mp4,video/webm,video/quicktime", isVideo: true },
  { id: "actualites", label: "Actualités", icon: Newspaper, freeMax: 5, accept: "", isVideo: false },
] as const;

export const Route = createFileRoute("/_authenticated/gallery")({
  ssr: false, component: GalleryPage,
});

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function GalleryPage() {
  const me = useCurrentProfile()!;
  const update = useApp((s) => s.updateCurrent);
  const [tab, setTab] = useState<typeof CATS[number]["id"]>("photos");
  const [text, setText] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const cat = CATS.find((c) => c.id === tab)!;
  const items = me.gallery.filter((g) => g.category === tab);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = cat.freeMax - items.length;
    const accepted = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Limite : ${cat.freeMax} ${cat.label.toLowerCase()} — ${remaining} ajouté(s)`);
    }
    for (const f of accepted) {
      if (cat.isVideo) {
        if (f.size > 100 * 1024 * 1024) { toast.error(`${f.name} : 100 Mo max`); continue; }
        const ok = await new Promise<boolean>((resolve) => {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => resolve(v.duration <= 30.5);
          v.onerror = () => resolve(false);
          v.src = URL.createObjectURL(f);
        });
        if (!ok) { toast.error(`${f.name} : 30 secondes max`); continue; }
      } else if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name} : 8 Mo max`); continue;
      }
      const url = await fileToDataURL(f);
      const item: GalleryItem = {
        id: `g${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category: tab,
        url,
        mediaType: cat.isVideo ? "video" : "image",
        createdAt: Date.now(),
      };
      update({ gallery: [...useApp.getState().profiles[me.id].gallery, item] });
    }
    if (fileInput.current) fileInput.current.value = "";
    toast.success("Médias ajoutés à la galerie");
  };

  const addText = () => {
    if (!text.trim()) return;
    if (items.length >= cat.freeMax) return toast.error(`Limite : ${cat.freeMax}`);
    const item: GalleryItem = {
      id: `g${Date.now()}`,
      category: tab,
      text: text.slice(0, 280),
      createdAt: Date.now(),
    };
    update({ gallery: [...me.gallery, item] });
    setText("");
  };

  const remove = (id: string) => update({ gallery: me.gallery.filter((g) => g.id !== id) });

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Galerie</h1>
        <p className="mt-1 text-sm text-muted-foreground">Photos, affiches, visuels, vidéos (max 30s, 100 Mo) et actualités.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => {
          const Icon = c.icon;
          const active = tab === c.id;
          const n = me.gallery.filter((g) => g.category === c.id).length;
          return (
            <button key={c.id} onClick={() => setTab(c.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active ? "bg-gradient-brand text-white shadow-glow" : "bg-card border border-border hover:bg-secondary"
              }`}>
              <Icon className="h-4 w-4" /> {c.label}
              <span className="text-xs opacity-70">({n}/{c.freeMax})</span>
            </button>
          );
        })}
      </div>

      <div className="surface-elevated p-6">
        {tab === "actualites" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <textarea
              value={text} onChange={(e) => setText(e.target.value.slice(0, 280))}
              placeholder="Ton actualité (280 caractères max)"
              rows={2}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-brand"
            />
            <button onClick={addText} disabled={items.length >= cat.freeMax}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50">
              <Plus className="h-4 w-4" /> Publier
            </button>
          </div>
        ) : (
          <>
            <input ref={fileInput} type="file" accept={cat.accept} multiple={!cat.isVideo} className="hidden" onChange={onPick} />
            <button
              onClick={() => fileInput.current?.click()}
              disabled={items.length >= cat.freeMax}
              className="w-full rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-8 text-center hover:bg-primary/10 disabled:opacity-50"
            >
              <Upload className="mx-auto h-8 w-8 text-primary" />
              <div className="mt-2 text-sm font-semibold">Charger {cat.label.toLowerCase()}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {cat.isVideo ? "MP4/WebM, 100 Mo max, 30 secondes max, lecture en boucle" : "JPG/PNG/WebP, 8 Mo max, sélection multiple OK"}
              </div>
            </button>
          </>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.map((g) => (
            <div key={g.id} className="group relative overflow-hidden rounded-2xl border border-border bg-secondary">
              {g.url ? (
                g.mediaType === "video" ? (
                  <video src={g.url} className="aspect-square w-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={g.url} alt="" className="aspect-square w-full object-cover" />
                )
              ) : (
                <div className="aspect-square p-4 text-sm">{g.text}</div>
              )}
              <button onClick={() => remove(g.id)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="col-span-full text-center text-sm text-muted-foreground py-8">Aucun élément pour l'instant.</div>}
        </div>
      </div>
    </div>
  );
}

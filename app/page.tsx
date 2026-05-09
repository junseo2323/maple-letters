"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Share2, Settings as SettingsIcon, Lock, Unlock, Check, Trash2 } from "lucide-react";

import { apiRequest, setOwnerPassword, getOwnerPassword } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapleLeaf, HeartIcon, StarIcon } from "@/components/MapleLeaf";
import {
  GRID_COLS,
  GRID_ROWS,
  TOTAL_CELLS,
  COLORS,
  STICKERS,
  type PublicMessage,
} from "@/lib/schema";
import { translations, type Lang, type T } from "@/lib/i18n";

interface SettingsResp {
  paperName: string;
  hasPassword: boolean;
  customSubtitle: string | null;
  customCta: string | null;
  customWriteTitle: string | null;
  customWriteDesc: string | null;
  customLockedMsg: string | null;
  customShareText: string | null;
  defaultLang: "ko" | "en";
}

const CUSTOM_TEXT_KEYS = [
  "customSubtitle",
  "customCta",
  "customWriteTitle",
  "customWriteDesc",
  "customLockedMsg",
  "customShareText",
] as const;
type CustomTextKey = (typeof CUSTOM_TEXT_KEYS)[number];

const TILE_CLASS: Record<string, string> = {
  peach: "tile-peach",
  lavender: "tile-lavender",
  mint: "tile-mint",
  butter: "tile-butter",
  sky: "tile-sky",
  rose: "tile-rose",
};

function StickerIcon({ kind, size = 14 }: { kind: string; size?: number }) {
  if (kind === "maple") return <MapleLeaf size={size} color="#D52B1E" />;
  if (kind === "heart") return <HeartIcon size={size} filled className="text-rose-500" />;
  if (kind === "star") return <StarIcon size={size} className="text-amber-500" />;
  return null;
}

// Cells: cols 0..3 = left red, 4..11 = white, 12..15 = right red
function bandOf(cell: number): "red" | "white" {
  const col = cell % GRID_COLS;
  if (col < 4 || col >= 12) return "red";
  return "white";
}

// Tiny inline toast
function useToast() {
  const [toast, setToastState] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (msg: string, tone: "ok" | "err" = "ok") => {
    if (timer.current) clearTimeout(timer.current);
    setToastState({ msg, tone });
    timer.current = setTimeout(() => setToastState(null), 2400);
  };
  return { toast, show };
}

export default function Home() {
  const [lang, setLang] = useState<Lang | null>(null);
  const [pickedCell, setPickedCell] = useState<number | null>(null);
  const [openWrite, setOpenWrite] = useState(false);
  const [selected, setSelected] = useState<PublicMessage | null>(null);
  const [openSettings, setOpenSettings] = useState(false);
  const [hearted, setHearted] = useState<Set<number>>(new Set());
  const [isOwner, setIsOwner] = useState(false);
  const { toast, show } = useToast();
  const effectiveLang: Lang = lang ?? "en";
  const t = translations[effectiveLang];
  const qc = useQueryClient();

  const { data: settings } = useQuery<SettingsResp>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest<SettingsResp>("GET", "/api/settings"),
  });

  // Apply default language from settings the first time it loads
  useEffect(() => {
    if (lang === null && settings?.defaultLang) {
      setLang(settings.defaultLang);
    }
  }, [lang, settings?.defaultLang]);

  // Resolve custom text overrides (server-set text wins over i18n)
  const txt = useMemo(
    () => ({
      subtitle: settings?.customSubtitle || t.subtitle,
      cta: settings?.customCta || t.cta,
      writeTitle: settings?.customWriteTitle || t.writeTitle,
      writeDesc: settings?.customWriteDesc || t.writeDesc,
      locked: settings?.customLockedMsg || t.locked,
    }),
    [settings, t],
  );

  const { data: messages, isLoading } = useQuery<PublicMessage[]>({
    queryKey: ["/api/messages"],
    queryFn: () => apiRequest<PublicMessage[]>("GET", "/api/messages"),
  });

  const cellMap = useMemo(() => {
    const m = new Map<number, PublicMessage>();
    (messages ?? []).forEach((msg) => m.set(msg.cell, msg));
    return m;
  }, [messages]);

  const filledCount = messages?.length ?? 0;

  // ─── Mutations ─────────────────────────────────────────────────────────
  const create = useMutation({
    mutationFn: (input: {
      cell: number;
      nickname: string;
      content: string;
      color: string;
      sticker: string;
    }) => apiRequest("POST", "/api/messages", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/messages"] });
      setOpenWrite(false);
      setPickedCell(null);
      show(lang === "ko" ? "편지 저장됐어요" : "Letter saved");
    },
    onError: (e: Error & { status?: number }) => {
      if (e.status === 409) {
        show(t.cellTaken, "err");
        qc.invalidateQueries({ queryKey: ["/api/messages"] });
        setOpenWrite(false);
      } else {
        show(t.saveFailed, "err");
      }
    },
  });

  const heartMut = useMutation({
    mutationFn: (id: number) => apiRequest<{ hearts: number }>("POST", `/api/messages/${id}/heart`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/messages"] }),
  });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest<{ ok: boolean }>("DELETE", `/api/messages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/messages"] });
      show(t.deleted);
      setSelected(null);
      setConfirmDelete(false);
    },
    onError: () => show(t.deleteFailed, "err"),
  });

  // ─── Cell click ────────────────────────────────────────────────────────
  const onCellClick = (cell: number) => {
    const existing = cellMap.get(cell);
    if (existing) {
      setSelected(existing);
    } else {
      setPickedCell(cell);
      setOpenWrite(true);
    }
  };

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareText = settings?.customShareText || (settings?.paperName ?? "Maple Letters");
    const data = {
      title: settings?.paperName ?? "Maple Letters",
      text: shareText,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(data);
        return;
      }
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      show(t.copied);
    } catch {
      // user cancelled share, ignore
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <MapleLeaf size={20} color="#D52B1E" />
            <span className="font-semibold text-foreground">{settings?.paperName ?? "Maple Letters"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isOwner && (
              <span
                title={t.locked2}
                className="flex h-7 items-center gap-1 rounded-full bg-maple-light px-2.5 text-xs font-medium text-maple"
              >
                <Unlock className="h-3 w-3" /> {t.locked2}
              </span>
            )}
            <button
              onClick={onShare}
              title={t.copyUrl}
              className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpenSettings(true)}
              title={t.settingsTitle}
              className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
            <div className="ml-1.5 flex overflow-hidden rounded-full border border-border text-xs">
              <button
                onClick={() => setLang("ko")}
                className={`px-3 py-1.5 ${effectiveLang === "ko" ? "bg-maple text-white" : "bg-background text-foreground/70"}`}
              >
                KR
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 ${effectiveLang === "en" ? "bg-maple text-white" : "bg-background text-foreground/70"}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-8 text-center">
        <p className="text-base text-foreground/80">{txt.subtitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t.progress(filledCount, TOTAL_CELLS)}</p>
      </section>

      {/* ── Flag grid ──────────────────────────────────────────────── */}
      <section className="px-4 pb-6 pt-5">
        <div className="mx-auto w-full max-w-[1200px] overflow-x-auto">
          <div
            className="paper-card relative mx-auto rounded-2xl"
            style={{
              minWidth: 760,
              width: 1200,
              aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
              maxWidth: "100%",
            }}
          >
            {/* Flag bands */}
            <div className="absolute inset-0 flex overflow-hidden rounded-2xl">
              <div className="h-full" style={{ width: `${(4 / 16) * 100}%`, background: "linear-gradient(180deg,#E63946,#C5121E)" }} />
              <div className="h-full" style={{ width: `${(8 / 16) * 100}%`, background: "#FFFBF5" }} />
              <div className="h-full" style={{ width: `${(4 / 16) * 100}%`, background: "linear-gradient(180deg,#E63946,#C5121E)" }} />
            </div>

            {/* Center maple watermark */}
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${(4 / 16) * 100}%`,
                top: 0,
                width: `${(8 / 16) * 100}%`,
                height: "100%",
              }}
            >
              <div className="flex h-full w-full items-center justify-center opacity-25">
                <MapleLeaf size={420} color="#D52B1E" />
              </div>
            </div>

            {/* Grid */}
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
              }}
            >
              {Array.from({ length: TOTAL_CELLS }).map((_, cell) => {
                const msg = cellMap.get(cell);
                const band = bandOf(cell);
                const tileClass = msg ? TILE_CLASS[msg.color] ?? "tile-butter" : "";
                const isHearted = msg ? hearted.has(msg.id) : false;

                return (
                  <button
                    key={cell}
                    onClick={() => onCellClick(cell)}
                    className={`group relative border border-white/15 transition-all ${
                      msg
                        ? `${tileClass} m-0.5 rounded-md shadow-sm hover:scale-[1.04] hover:shadow-md`
                        : band === "red"
                          ? "hover:bg-white/15"
                          : "hover:bg-maple/10"
                    }`}
                    aria-label={msg ? `${msg.nickname} - cell ${cell}` : `empty cell ${cell}`}
                  >
                    {msg && (
                      <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-center">
                        <StickerIcon kind={msg.sticker} size={12} />
                        <span className="hand-text truncate text-[13px] leading-none text-foreground">
                          {msg.nickname}
                        </span>
                        {msg.hearts > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] text-rose-500">
                            <HeartIcon size={8} filled />
                            {msg.hearts}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground sm:hidden">{t.flagFull}</p>
        </div>

        {/* CTA — informational only, not clickable */}
        <div className="mt-6 flex justify-center">
          <p
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-sm text-muted-foreground"
            data-testid="text-cta"
          >
            <Pencil className="h-3.5 w-3.5" />
            {txt.cta}
          </p>
        </div>
      </section>

      {/* ── Write dialog ───────────────────────────────────────────── */}
      <WriteDialog
        open={openWrite}
        onOpenChange={(o) => {
          setOpenWrite(o);
          if (!o) setPickedCell(null);
        }}
        cell={pickedCell ?? 0}
        t={t}
        title={txt.writeTitle}
        desc={txt.writeDesc}
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
      />

      {/* ── Detail dialog ──────────────────────────────────────────── */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setConfirmDelete(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickerIcon kind={selected?.sticker ?? "none"} size={16} />
              <span className="hand-text text-2xl">{selected?.nickname}</span>
            </DialogTitle>
            <DialogDescription>{t.detailTitle}</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className={`relative rounded-xl p-5 ${TILE_CLASS[selected.color] ?? "tile-butter"}`}>
              <div className="tape" />
              {isOwner && "content" in selected && (selected as PublicMessage & { content?: string }).content ? (
                <p className="hand-text whitespace-pre-wrap text-lg leading-relaxed text-foreground">
                  {(selected as PublicMessage & { content: string }).content}
                </p>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Lock className="h-6 w-6 text-foreground/40" />
                  <p className="text-sm text-foreground/70">{txt.locked}</p>
                  <p className="text-xs text-foreground/50">{t.unlockHint}</p>
                </div>
              )}
            </div>
          )}

          {selected && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (!selected || hearted.has(selected.id)) return;
                    heartMut.mutate(selected.id);
                    setHearted((s) => new Set(s).add(selected.id));
                  }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
                  disabled={hearted.has(selected.id)}
                >
                  <HeartIcon size={14} filled={hearted.has(selected.id)} className="text-rose-500" />
                  {selected.hearts + (hearted.has(selected.id) ? 1 : 0)}
                </button>
                <div className="flex items-center gap-2">
                  {isOwner && !confirmDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      data-testid="button-delete-letter"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      {t.deleteBtn}
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setSelected(null)}>
                    {t.cancel}
                  </Button>
                </div>
              </div>
              {isOwner && confirmDelete && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                  <p className="mb-2 text-sm text-foreground">{t.deleteConfirm}</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                      {t.cancel}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => selected && deleteMut.mutate(selected.id)}
                      disabled={deleteMut.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-delete-confirm"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      {t.deleteConfirmYes}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Settings dialog (also handles unlock) ──────────────────── */}
      <SettingsDialog
        open={openSettings}
        onOpenChange={setOpenSettings}
        t={t}
        settings={settings ?? null}
        isOwner={isOwner}
        onUnlocked={(pw) => {
          setOwnerPassword(pw);
          setIsOwner(true);
          qc.invalidateQueries({ queryKey: ["/api/messages"] });
          show(t.locked2);
        }}
        onLock={() => {
          setOwnerPassword(null);
          setIsOwner(false);
          qc.invalidateQueries({ queryKey: ["/api/messages"] });
          show(t.locking);
        }}
        onWrong={() => show(t.wrongPassword, "err")}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["/api/settings"] });
          show(t.settingsSaved);
        }}
        onFailed={() => show(t.settingsFailed, "err")}
      />

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-fade-in">
          <div
            className={`rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg ${
              toast.tone === "err" ? "bg-maple-dark" : "bg-foreground"
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WriteDialog ──────────────────────────────────────────────────────────
function WriteDialog({
  open,
  onOpenChange,
  cell,
  t,
  title,
  desc,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cell: number;
  t: T;
  title: string;
  desc: string;
  onSubmit: (v: { cell: number; nickname: string; content: string; color: string; sticker: string }) => void;
  submitting: boolean;
}) {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<string>("peach");
  const [sticker, setSticker] = useState<string>("none");

  useEffect(() => {
    if (open) {
      setNickname("");
      setContent("");
      setColor("peach");
      setSticker("none");
    }
  }, [open]);

  const submit = () => {
    if (!nickname.trim() || !content.trim()) return;
    onSubmit({ cell, nickname: nickname.trim(), content: content.trim(), color, sticker });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">{t.nickname}</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t.nicknamePh}
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">{t.message}</Label>
              <span className="text-xs text-muted-foreground">{t.charCount(content.length)}</span>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder={t.messagePh}
              className="hand-text min-h-[140px] text-lg leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t.color}</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full ring-offset-2 transition-all ${TILE_CLASS[c]} ${
                    color === c ? "ring-2 ring-maple ring-offset-background" : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t.sticker}</Label>
            <div className="flex gap-2">
              {STICKERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSticker(s)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                    sticker === s ? "border-maple bg-maple-light" : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {s === "none" ? <span className="text-xs text-foreground/50">×</span> : <StickerIcon kind={s} size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button variant="primary" onClick={submit} disabled={submitting || !nickname.trim() || !content.trim()}>
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SettingsDialog (combined: lock/unlock + custom text + password) ─────────────
const CUSTOM_LABEL_KEYS: Record<CustomTextKey, keyof T> = {
  customSubtitle: "customSubtitleLabel",
  customCta: "customCtaLabel",
  customWriteTitle: "customWriteTitleLabel",
  customWriteDesc: "customWriteDescLabel",
  customLockedMsg: "customLockedMsgLabel",
  customShareText: "customShareTextLabel",
};

function SettingsDialog({
  open,
  onOpenChange,
  t,
  settings,
  isOwner,
  onUnlocked,
  onLock,
  onWrong,
  onSaved,
  onFailed,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  t: T;
  settings: SettingsResp | null;
  isOwner: boolean;
  onUnlocked: (pw: string) => void;
  onLock: () => void;
  onWrong: () => void;
  onSaved: () => void;
  onFailed: () => void;
}) {
  const hasPassword = settings?.hasPassword ?? false;
  const currentName = settings?.paperName ?? "";

  const [name, setName] = useState(currentName);
  const [customs, setCustoms] = useState<Record<CustomTextKey, string>>({
    customSubtitle: "",
    customCta: "",
    customWriteTitle: "",
    customWriteDesc: "",
    customLockedMsg: "",
    customShareText: "",
  });

  // Unlock state
  const [unlockPw, setUnlockPw] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);

  // Save state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(settings?.paperName ?? "");
      setCustoms({
        customSubtitle: settings?.customSubtitle ?? "",
        customCta: settings?.customCta ?? "",
        customWriteTitle: settings?.customWriteTitle ?? "",
        customWriteDesc: settings?.customWriteDesc ?? "",
        customLockedMsg: settings?.customLockedMsg ?? "",
        customShareText: settings?.customShareText ?? "",
      });
      setUnlockPw("");
      setCurrentPw("");
      setNewPw("");
    }
  }, [open, settings]);

  const tryUnlock = async () => {
    if (!unlockPw) return;
    setUnlockBusy(true);
    try {
      const r = await apiRequest<{ ok: boolean }>("POST", "/api/owner/verify", { password: unlockPw });
      if (r.ok) {
        onUnlocked(unlockPw);
        setUnlockPw("");
      } else {
        onWrong();
      }
    } finally {
      setUnlockBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const body: Record<string, string | null> = {};
      if (name !== currentName) body.paperName = name;
      // Custom text: send each field; empty string -> null clears
      for (const key of CUSTOM_TEXT_KEYS) {
        const value = customs[key].trim();
        const original = (settings?.[key] as string | null | undefined) ?? "";
        if (value !== original) {
          body[key] = value === "" ? null : value;
        }
      }
      if (newPw) body.newPassword = newPw;
      if (hasPassword && currentPw) body.currentPassword = currentPw;
      if (Object.keys(body).length === 0) {
        onOpenChange(false);
        return;
      }
      await apiRequest("PATCH", "/api/settings", body);
      if (newPw) setOwnerPassword(newPw);
      onSaved();
      onOpenChange(false);
    } catch {
      onFailed();
    } finally {
      setBusy(false);
    }
  };

  // Show unlock-only view if password set but not unlocked yet
  const needsUnlock = hasPassword && !isOwner;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.settingsTitle}</DialogTitle>
          {needsUnlock && <DialogDescription>{t.unlockDesc}</DialogDescription>}
        </DialogHeader>

        {needsUnlock ? (
          <>
            <div className="space-y-1.5">
              <Label>{t.ownerPassword}</Label>
              <Input
                type="password"
                value={unlockPw}
                onChange={(e) => setUnlockPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button variant="primary" onClick={tryUnlock} disabled={unlockBusy || !unlockPw}>
                {t.unlock}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              {/* Lock status / lock button */}
              {isOwner && hasPassword && (
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Unlock className="h-4 w-4 text-maple" />
                    <span className="font-medium text-foreground">{t.locked2}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onLock}>
                    <Lock className="mr-1.5 h-3.5 w-3.5" />
                    {t.lockBtn}
                  </Button>
                </div>
              )}

              {/* Paper name */}
              <div className="space-y-1.5">
                <Label>{t.paperName}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.paperNamePh} maxLength={40} />
              </div>

              {/* Custom text section */}
              <div className="space-y-2 rounded-md border border-border p-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t.customTextHeading}</h3>
                  <p className="text-xs text-muted-foreground">{t.customTextDesc}</p>
                </div>
                {CUSTOM_TEXT_KEYS.map((key) => {
                  const labelKey = CUSTOM_LABEL_KEYS[key];
                  const isLong = key === "customWriteDesc" || key === "customLockedMsg";
                  return (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{t[labelKey] as string}</Label>
                      {isLong ? (
                        <Textarea
                          value={customs[key]}
                          onChange={(e) =>
                            setCustoms((c) => ({ ...c, [key]: e.target.value }))
                          }
                          placeholder={t.customPlaceholder}
                          maxLength={300}
                          className="min-h-[60px] text-sm"
                        />
                      ) : (
                        <Input
                          value={customs[key]}
                          onChange={(e) =>
                            setCustoms((c) => ({ ...c, [key]: e.target.value }))
                          }
                          placeholder={t.customPlaceholder}
                          maxLength={140}
                          className="text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Password section */}
              <div className="space-y-2 rounded-md border border-border p-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {hasPassword ? t.changePassword : t.passwordSection}
                </h3>
                {hasPassword && (
                  <div className="space-y-1">
                    <Label className="text-xs">{t.currentPassword}</Label>
                    <Input
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">{hasPassword ? t.newPassword : t.ownerPassword}</Label>
                  <Input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder={!hasPassword ? t.setPasswordFirst : ""}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button variant="primary" onClick={save} disabled={busy}>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {t.saveSettings}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Share2, Settings as SettingsIcon, Lock, Unlock } from "lucide-react";

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
}

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
  const [lang, setLang] = useState<Lang>("ko");
  const [pickedCell, setPickedCell] = useState<number | null>(null);
  const [openWrite, setOpenWrite] = useState(false);
  const [selected, setSelected] = useState<PublicMessage | null>(null);
  const [openUnlock, setOpenUnlock] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [hearted, setHearted] = useState<Set<number>>(new Set());
  const [isOwner, setIsOwner] = useState(false);
  const { toast, show } = useToast();
  const t = translations[lang];
  const qc = useQueryClient();

  const { data: settings } = useQuery<SettingsResp>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest<SettingsResp>("GET", "/api/settings"),
  });

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

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      show(t.copied);
    } catch {}
  };

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <MapleLeaf size={20} color="#D52B1E" />
            <span className="font-semibold text-foreground">{settings?.paperName ?? "Maple Letters"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => (isOwner ? setIsOwner(false) : setOpenUnlock(true))}
              title={isOwner ? t.locked2 : t.locking}
              className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              {isOwner ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setOpenSettings(true)}
              title={t.settingsTitle}
              className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onCopy}
              title={t.copyUrl}
              className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <div className="ml-1.5 flex overflow-hidden rounded-full border border-border text-xs">
              <button
                onClick={() => setLang("ko")}
                className={`px-3 py-1.5 ${lang === "ko" ? "bg-maple text-white" : "bg-background text-foreground/70"}`}
              >
                KR
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 ${lang === "en" ? "bg-maple text-white" : "bg-background text-foreground/70"}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-7 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-maple-light px-3 py-1 text-xs font-medium text-maple">
          <MapleLeaf size={12} color="#D52B1E" /> {t.madeIn}
        </span>
        <p className="mt-3 text-base text-foreground/80">{t.subtitle}</p>
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

        {/* CTA */}
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            onClick={() => {
              const empty = Array.from({ length: TOTAL_CELLS }).findIndex((_, i) => !cellMap.has(i));
              if (empty >= 0) {
                setPickedCell(empty);
                setOpenWrite(true);
              }
            }}
            disabled={isLoading || filledCount >= TOTAL_CELLS}
          >
            <Pencil className="mr-2 h-4 w-4" /> {t.cta}
          </Button>
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
        onSubmit={(values) => create.mutate(values)}
        submitting={create.isPending}
      />

      {/* ── Detail dialog ──────────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
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
                  <p className="text-sm text-foreground/70">{t.locked}</p>
                  <p className="text-xs text-foreground/50">{t.unlockHint}</p>
                </div>
              )}
            </div>
          )}

          {selected && (
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
              <Button variant="ghost" onClick={() => setSelected(null)}>
                {t.cancel}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Unlock dialog ──────────────────────────────────────────── */}
      <UnlockDialog
        open={openUnlock}
        onOpenChange={setOpenUnlock}
        t={t}
        hasPassword={settings?.hasPassword ?? false}
        onUnlocked={(pw) => {
          setOwnerPassword(pw);
          setIsOwner(true);
          qc.invalidateQueries({ queryKey: ["/api/messages"] });
          setOpenUnlock(false);
          show(t.locked2);
        }}
        onWrong={() => show(t.wrongPassword, "err")}
        onNoPassword={() => {
          setOpenUnlock(false);
          setOpenSettings(true);
        }}
      />

      {/* ── Settings dialog ────────────────────────────────────────── */}
      <SettingsDialog
        open={openSettings}
        onOpenChange={setOpenSettings}
        t={t}
        currentName={settings?.paperName ?? ""}
        hasPassword={settings?.hasPassword ?? false}
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
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cell: number;
  t: T;
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
          <DialogTitle>{t.writeTitle}</DialogTitle>
          <DialogDescription>{t.writeDesc}</DialogDescription>
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

// ─── UnlockDialog ─────────────────────────────────────────────────────────
function UnlockDialog({
  open,
  onOpenChange,
  t,
  hasPassword,
  onUnlocked,
  onWrong,
  onNoPassword,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  t: T;
  hasPassword: boolean;
  onUnlocked: (pw: string) => void;
  onWrong: () => void;
  onNoPassword: () => void;
}) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPw("");
      if (!hasPassword) onNoPassword();
    }
  }, [open, hasPassword, onNoPassword]);

  const submit = async () => {
    if (!pw) return;
    setBusy(true);
    try {
      const r = await apiRequest<{ ok: boolean }>("POST", "/api/owner/verify", { password: pw });
      if (r.ok) onUnlocked(pw);
      else onWrong();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.unlockTitle}</DialogTitle>
          <DialogDescription>{t.unlockDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>{t.ownerPassword}</Label>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !pw}>
            {t.unlock}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SettingsDialog ───────────────────────────────────────────────────────
function SettingsDialog({
  open,
  onOpenChange,
  t,
  currentName,
  hasPassword,
  onSaved,
  onFailed,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  t: T;
  currentName: string;
  hasPassword: boolean;
  onSaved: () => void;
  onFailed: () => void;
}) {
  const [name, setName] = useState(currentName);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setCurrentPw("");
      setNewPw("");
    }
  }, [open, currentName]);

  const submit = async () => {
    setBusy(true);
    try {
      const body: Record<string, string> = {};
      if (name && name !== currentName) body.paperName = name;
      if (newPw) body.newPassword = newPw;
      if (hasPassword && currentPw) body.currentPassword = currentPw;
      if (Object.keys(body).length === 0) {
        onOpenChange(false);
        return;
      }
      await apiRequest("PATCH", "/api/settings", body);
      // If first-time password set, persist for this session
      if (newPw) setOwnerPassword(newPw);
      onSaved();
      onOpenChange(false);
    } catch {
      onFailed();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.settingsTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t.paperName}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.paperNamePh} maxLength={40} />
          </div>
          {hasPassword && (
            <div className="space-y-1.5">
              <Label>{t.currentPassword}</Label>
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{hasPassword ? t.newPassword : t.ownerPassword}</Label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder={!hasPassword ? t.firstSetup : ""}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

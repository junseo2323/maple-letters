import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { z } from "zod";

// ─── Grid configuration ─────────────────────────────────────────────────────
export const GRID_COLS = 16;
export const GRID_ROWS = 8;
export const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

// ─── Tables ─────────────────────────────────────────────────────────────────
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    cell: integer("cell").notNull(),
    nickname: text("nickname").notNull(),
    content: text("content").notNull(),
    color: text("color").notNull().default("peach"),
    sticker: text("sticker").notNull().default("none"),
    hearts: integer("hearts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    cellUnique: unique("messages_cell_unique").on(t.cell),
  }),
);

export const settings = pgTable("settings", {
  id: integer("id").primaryKey(), // always 1
  paperName: text("paper_name").notNull().default("Maple Letters"),
  ownerPasswordHash: text("owner_password_hash"),
  // Customizable user-facing text (overrides i18n defaults when set)
  customSubtitle: text("custom_subtitle"),
  customCta: text("custom_cta"),
  customWriteTitle: text("custom_write_title"),
  customWriteDesc: text("custom_write_desc"),
  customLockedMsg: text("custom_locked_msg"),
  customShareText: text("custom_share_text"),
  defaultLang: text("default_lang").notNull().default("en"),
});

// ─── Inferred types ─────────────────────────────────────────────────────────
export type Message = typeof messages.$inferSelect;
export type Settings = typeof settings.$inferSelect;

export type PublicMessage = Omit<Message, "content"> & { hasContent: boolean };

// ─── Validation ─────────────────────────────────────────────────────────────
export const COLORS = ["peach", "lavender", "mint", "butter", "sky", "rose"] as const;
export const STICKERS = ["maple", "heart", "star", "none"] as const;

export const insertMessageSchema = z.object({
  cell: z.number().int().min(0).max(TOTAL_CELLS - 1),
  nickname: z.string().trim().min(1).max(20),
  content: z.string().trim().min(1).max(500),
  color: z.enum(COLORS).default("peach"),
  sticker: z.enum(STICKERS).default("none"),
});

export const updateSettingsSchema = z.object({
  paperName: z.string().trim().min(1).max(40).optional(),
  newPassword: z.string().min(4).max(64).optional(),
  currentPassword: z.string().optional(),
  customSubtitle: z.string().trim().max(120).nullable().optional(),
  customCta: z.string().trim().max(60).nullable().optional(),
  customWriteTitle: z.string().trim().max(60).nullable().optional(),
  customWriteDesc: z.string().trim().max(160).nullable().optional(),
  customLockedMsg: z.string().trim().max(120).nullable().optional(),
  customShareText: z.string().trim().max(200).nullable().optional(),
  defaultLang: z.enum(["ko", "en"]).optional(),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

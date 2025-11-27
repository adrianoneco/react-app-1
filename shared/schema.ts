import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  celular: text("celular"),
  externalId: text("external_id"),
  role: text("role").notNull().default("client"), // 'admin' | 'client'
  avatar: text("avatar"),
  status: text("status").notNull().default("active"), // 'active' | 'inactive'
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
}, (table) => [
  uniqueIndex("unique_external_id").on(table.externalId).where(sql`${table.externalId} IS NOT NULL AND ${table.externalId} != ''`),
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
  resetToken: true,
  resetTokenExpiry: true,
}).extend({
  password: z.string().min(6),
  celular: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
});

export const selectUserSchema = createSelectSchema(users);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateUserSchema = insertUserSchema.partial().omit({
  password: true,
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const newPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SelectUser = Omit<User, "password" | "resetToken" | "resetTokenExpiry">;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

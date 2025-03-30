import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Keep the original users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// S3 Object Type Definition
export const s3ObjectSchema = z.object({
  key: z.string(),
  size: z.number().optional(),
  lastModified: z.date().optional(),
  type: z.string().optional(),
  isFolder: z.boolean().optional(),
  etag: z.string().optional(),
});

export type S3Object = z.infer<typeof s3ObjectSchema>;

// S3 Folder Type Definition
export const s3FolderSchema = z.object({
  key: z.string(),
  name: z.string(),
  path: z.string(),
});

export type S3Folder = z.infer<typeof s3FolderSchema>;

// Starred Item Schema
export const starredItemSchema = z.object({
  key: z.string(),
  addedAt: z.date().default(() => new Date()),
});

export type StarredItem = z.infer<typeof starredItemSchema>;

// Recent Item Schema
export const recentItemSchema = z.object({
  key: z.string(),
  accessedAt: z.date().default(() => new Date()),
});

export type RecentItem = z.infer<typeof recentItemSchema>;

// Trash Item Schema
export const trashItemSchema = z.object({
  key: z.string(),
  originalKey: z.string(),
  deletedAt: z.date().default(() => new Date()),
});

export type TrashItem = z.infer<typeof trashItemSchema>;

// File Upload Schema
export const fileUploadSchema = z.object({
  key: z.string(),
  file: z.any(),
});

export type FileUpload = z.infer<typeof fileUploadSchema>;

// File Rename Schema
export const fileRenameSchema = z.object({
  oldKey: z.string(),
  newName: z.string(),
});

export type FileRename = z.infer<typeof fileRenameSchema>;

// File Move Schema
export const fileMoveSchema = z.object({
  sourceKey: z.string(),
  destinationPath: z.string(),
});

export type FileMove = z.infer<typeof fileMoveSchema>;

export const fileDropSchema = z.object({
  sourceKeys: z.array(z.string()),
  destinationPath: z.string(),
});

export type FileDrop = z.infer<typeof fileDropSchema>;

// File Share Schema
export const fileShareSchema = z.object({
  key: z.string(),
  expiresIn: z.number().min(1).max(604800).default(3600), // Default 1 hour, max 7 days in seconds
});

export type FileShare = z.infer<typeof fileShareSchema>;

// Shared File Schema (for tracking shared files)
export const sharedFileSchema = z.object({
  key: z.string(),
  shareId: z.string(),
  url: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().default(() => new Date()),
});

export type SharedFile = z.infer<typeof sharedFileSchema>;

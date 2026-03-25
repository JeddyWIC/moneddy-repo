import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const processes = sqliteTable("processes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  category: text("category"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const processTags = sqliteTable("process_tags", {
  processId: integer("process_id")
    .notNull()
    .references(() => processes.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  processId: integer("process_id")
    .notNull()
    .references(() => processes.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  data: text("data").notNull(),
});

export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  processId: integer("process_id")
    .notNull()
    .references(() => processes.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Relations
export const processesRelations = relations(processes, ({ many }) => ({
  tags: many(processTags),
  images: many(images),
  attachments: many(attachments),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  processes: many(processTags),
}));

export const processTagsRelations = relations(processTags, ({ one }) => ({
  process: one(processes, {
    fields: [processTags.processId],
    references: [processes.id],
  }),
  tag: one(tags, {
    fields: [processTags.tagId],
    references: [tags.id],
  }),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  process: one(processes, {
    fields: [images.processId],
    references: [processes.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  process: one(processes, {
    fields: [attachments.processId],
    references: [processes.id],
  }),
}));

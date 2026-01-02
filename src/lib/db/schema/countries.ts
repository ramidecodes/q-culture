import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const countries = pgTable("countries", {
  isoCode: text("iso_code").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

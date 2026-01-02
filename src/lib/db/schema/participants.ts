import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { countries } from "./countries";
import { workshops } from "./workshops";

export const participants = pgTable("participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id")
    .notNull()
    .references(() => workshops.id),
  name: text("name").notNull(),
  countryCode: text("country_code")
    .notNull()
    .references(() => countries.isoCode),
  sessionToken: text("session_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

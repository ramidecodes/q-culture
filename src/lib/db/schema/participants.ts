import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { countries } from "./countries";
import { workshops } from "./workshops";

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id),
    name: text("name").notNull(),
    countryCode: text("country_code")
      .notNull()
      .references(() => countries.isoCode),
    sessionToken: text("session_token").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    workshopSessionUnique: uniqueIndex(
      "participants_workshop_session_unique"
    ).on(table.workshopId, table.sessionToken),
  })
);

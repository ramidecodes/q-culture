import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { groups } from "./groups";
import { participants } from "./participants";

export const reflections = pgTable("reflections", {
  id: uuid("id").defaultRandom().primaryKey(),
  participantId: uuid("participant_id")
    .notNull()
    .unique()
    .references(() => participants.id),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id),
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

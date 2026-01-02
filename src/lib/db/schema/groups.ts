import {
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { participants } from "./participants";
import { workshops } from "./workshops";

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id")
    .notNull()
    .references(() => workshops.id),
  groupNumber: integer("group_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.participantId] }),
  })
);

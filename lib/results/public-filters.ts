import type { Prisma } from "@prisma/client";

export const publicResultWhere = {
  archivedAt: null,
} satisfies Prisma.ResultWhereInput;

export const publicStageResultWhere = {
  archivedAt: null,
} satisfies Prisma.StageResultWhereInput;

import type { Prisma } from "@prisma/client";

export const publicEventWhere = {
  visibility: "PUBLIC",
  archivedAt: null,
} satisfies Prisma.EventWhereInput;

export const publicRiderWhere = {
  visibility: "PUBLIC",
  archivedAt: null,
} satisfies Prisma.RiderWhereInput;

export const publicTeamWhere = {
  visibility: "PUBLIC",
  archivedAt: null,
} satisfies Prisma.TeamWhereInput;

export const publicManufacturerWhere = {
  visibility: "PUBLIC",
  archivedAt: null,
} satisfies Prisma.ManufacturerWhereInput;

export const publicMotorcycleWhere = {
  visibility: "PUBLIC",
  archivedAt: null,
} satisfies Prisma.MotorcycleWhereInput;

export const publicResultWhere = {
  archivedAt: null,
  event: {
    is: publicEventWhere,
  },
} satisfies Prisma.ResultWhereInput;

export const publicStageResultWhere = {
  archivedAt: null,
  stage: {
    is: {
      event: {
        is: publicEventWhere,
      },
    },
  },
} satisfies Prisma.StageResultWhereInput;

export type PointsSystemId = "fim-style" | "legacy-style" | "custom-style";

export type PointsSystem = {
  id: PointsSystemId;
  name: string;
  description: string;
  pointsByPosition: Record<number, number>;
  dnfPoints: number;
  dnsPoints: number;
  dsqPoints: number;
};

export const pointsSystems: PointsSystem[] = [
  {
    id: "fim-style",
    name: "FIM style",
    description: "Modern championship-style points allocation for final results.",
    pointsByPosition: {
      1: 20,
      2: 17,
      3: 15,
      4: 13,
      5: 11,
      6: 10,
      7: 9,
      8: 8,
      9: 7,
      10: 6,
      11: 5,
      12: 4,
      13: 3,
      14: 2,
      15: 1,
    },
    dnfPoints: 0,
    dnsPoints: 0,
    dsqPoints: 0,
  },
  {
    id: "legacy-style",
    name: "Legacy style",
    description: "Older 25-point winner table prepared for historic seasons.",
    pointsByPosition: {
      1: 25,
      2: 20,
      3: 16,
      4: 13,
      5: 11,
      6: 10,
      7: 9,
      8: 8,
      9: 7,
      10: 6,
      11: 5,
      12: 4,
      13: 3,
      14: 2,
      15: 1,
    },
    dnfPoints: 0,
    dnsPoints: 0,
    dsqPoints: 0,
  },
  {
    id: "custom-style",
    name: "Custom style",
    description: "Placeholder table for special classes or future rule changes.",
    pointsByPosition: {
      1: 10,
      2: 8,
      3: 6,
      4: 5,
      5: 4,
      6: 3,
      7: 2,
      8: 1,
    },
    dnfPoints: 0,
    dnsPoints: 0,
    dsqPoints: 0,
  },
];

export function getPointsSystem(id: PointsSystemId = "fim-style") {
  return pointsSystems.find((system) => system.id === id) ?? pointsSystems[0];
}

export function allocatePoints(
  position: number | null,
  status: "FINISHED" | "DNF" | "DNS" | "DSQ" | "UNKNOWN",
  pointsSystem: PointsSystem,
) {
  if (status === "DNF") {
    return pointsSystem.dnfPoints;
  }

  if (status === "DNS") {
    return pointsSystem.dnsPoints;
  }

  if (status === "DSQ") {
    return pointsSystem.dsqPoints;
  }

  if (!position || position < 1) {
    return 0;
  }

  return pointsSystem.pointsByPosition[position] ?? 0;
}

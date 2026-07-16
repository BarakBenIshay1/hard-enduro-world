export type PointsSystemId = "source-result-points";

export type PointsSystem = {
  id: PointsSystemId;
  name: string;
  description: string;
};

export const pointsSystems: PointsSystem[] = [
  {
    id: "source-result-points",
    name: "Source Result points",
    description:
      "Uses points already stored on persisted Result rows. No position-to-points table is inferred.",
  },
];

export function getPointsSystem(id: PointsSystemId = "source-result-points") {
  return pointsSystems.find((system) => system.id === id) ?? pointsSystems[0];
}

export function allocatePoints(
  points: number | null,
  status: "FINISHED" | "DNF" | "DNS" | "DSQ" | "UNKNOWN",
) {
  if (status === "UNKNOWN" || points === null) return 0;
  return points;
}

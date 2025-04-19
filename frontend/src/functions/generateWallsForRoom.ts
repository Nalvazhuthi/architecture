export const generateWallsFromRooms = (rooms: any) => {
  const uniqueWalls = new Set<string>();
  const result: any[] = [];

  rooms.forEach((room: any) => {
    for (let i = 0; i < room.points.length; i++) {
      const nextIndex = (i + 1) % room.points.length;
      const start = room.points[i];
      const end = room.points[nextIndex];

      const key = [start.x, start.z, end.x, end.z].sort().join(",");
      if (!uniqueWalls.has(key)) {
        uniqueWalls.add(key);
        result.push({ start, end });
      }
    }
  });

  return result;
};

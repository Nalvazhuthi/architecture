export const generateWallsFromRooms = (rooms: any) => {
  const uniqueWalls = new Set();
  rooms.forEach((room: any) => {
    for (let i = 0; i < room.points.length; i++) {
      const nextIndex = (i + 1) % room.points.length;
      const start = room.points[i];
      const end = room.points[nextIndex];
      const sortedPoints = [start, end].sort((a, b) => {
        if (a.x !== b.x) return a.x - b.x;
        return a.z - b.z;
      });
      uniqueWalls.add({
        start: sortedPoints[0],
        end: sortedPoints[1],
        roomIndex: rooms.indexOf(room),
        isVeranda: false,
      });
    }
  });
  return Array.from(uniqueWalls);
};

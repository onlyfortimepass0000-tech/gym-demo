export function generateQrPattern(seed: number = 42): boolean[] {
  const cells: boolean[] = [];
  for (let i = 0; i < 441; i++) {
    const r = Math.sin(i * 7.3 + seed) * 10000;
    cells.push(r - Math.floor(r) > 0.5);
  }
  const stampFinder = (col: number, row: number) => {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const idx = (row + dy) * 21 + (col + dx);
        const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6;
        const inner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        cells[idx] = edge || inner;
      }
    }
  };
  stampFinder(0, 0);
  stampFinder(14, 0);
  stampFinder(0, 14);
  return cells;
}

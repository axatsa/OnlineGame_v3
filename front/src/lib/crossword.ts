export interface CrosswordWord {
    word: string;
    clue: string;
    row: number; // 0-indexed
    col: number; // 0-indexed
    isAcross: boolean;
    number: number;
}

export interface CrosswordGrid {
    width: number;
    height: number;
    grid: string[][]; // 2D array, empty string for black, char for white
    words: CrosswordWord[];
}

export function generateCrosswordLayout(wordsData: { word: string; clue: string }[]): CrosswordGrid | null {
    // 1. Sort words by length descending
    const sortedWords = [...wordsData].sort((a, b) => b.word.length - a.word.length);

    // 2. Initialize grid (start large, crop later)
    const GRID_SIZE = 40;
    const CENTER = Math.floor(GRID_SIZE / 2);
    let grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(""));
    const placedWords: CrosswordWord[] = [];

    // Helper to check if a word fits
    const canPlace = (word: string, r: number, c: number, isAcross: boolean): boolean => {
        // Boundary check
        if (r < 0 || c < 0 || r >= GRID_SIZE || c >= GRID_SIZE) return false;
        if (isAcross && c + word.length > GRID_SIZE) return false;
        if (!isAcross && r + word.length > GRID_SIZE) return false;

        let hasIntersection = false;

        // Check cells
        for (let i = 0; i < word.length; i++) {
            const cr = isAcross ? r : r + i;
            const cc = isAcross ? c + i : c;
            const cell = grid[cr][cc];

            // Conflict: cell occupied by different letter
            if (cell !== "" && cell !== word[i]) return false;

            // Intersection found
            if (cell === word[i]) hasIntersection = true;

            // Check neighbors (to prevent accidental adjacency)
            // If this cell is empty in the grid, we must ensure we are not placing it right next to another word 
            // parallel to us, or extending a word incorrectly.
            // Simplified check: 
            if (cell === "") {
                // Check immediate neighbors perpendicular to direction
                // If across, check up/down. If vertical, check left/right.
                // UNLESS it's an intersection point.

                const neighbors = [
                    { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, // Up/Down
                    { dr: 0, dc: -1 }, { dr: 0, dc: 1 }  // Left/Right
                ];

                for (const n of neighbors) {
                    const nr = cr + n.dr;
                    const nc = cc + n.dc;
                    // If neighbor is occupied...
                    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] !== "") {
                        // If we are Across, and checking Up/Down, that's okay ONLY if it's part of a crossing word.
                        // But here we are in an empty cell, so if there is a neighbor, it creates a 2-letter cluster if not crossing properly.
                        // For simplicity: strict isolation. Cells perpendicular must be empty.
                        if (isAcross && (n.dr !== 0)) return false;
                        if (!isAcross && (n.dc !== 0)) return false;
                    }
                }

                // Also check directly before start and after end
                if (i === 0) {
                    const pr = isAcross ? r : r - 1;
                    const pc = isAcross ? c - 1 : c;
                    if (pr >= 0 && pr < GRID_SIZE && pc >= 0 && pc < GRID_SIZE && grid[pr][pc] !== "") return false;
                }
                if (i === word.length - 1) {
                    const nr = isAcross ? r : r + 1;
                    const nc = isAcross ? c + 1 : c;
                    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] !== "") return false;
                }
            }
        }

        // First word doesn't need intersection
        if (placedWords.length === 0) return true;

        return hasIntersection;
    };

    const place = (word: string, r: number, c: number, isAcross: boolean) => {
        for (let i = 0; i < word.length; i++) {
            const cr = isAcross ? r : r + i;
            const cc = isAcross ? c + i : c;
            grid[cr][cc] = word[i];
        }
    };

    // 3. Place words
    for (const item of sortedWords) {
        const word = item.word.toUpperCase();
        let placed = false;

        // First word centered
        if (placedWords.length === 0) {
            const r = CENTER;
            const c = CENTER - Math.floor(word.length / 2);
            place(word, r, c, true);
            placedWords.push({ ...item, word, row: r, col: c, isAcross: true, number: 0 });
            continue;
        }

        // Attempt to intersect with existing placed words
        // Shuffle placed words to vary layout? No, deterministic is fine.
        for (const pw of placedWords) {
            if (placed) break;

            // Check every letter overlap
            for (let i = 0; i < word.length; i++) {
                if (placed) break;
                for (let j = 0; j < pw.word.length; j++) {
                    if (word[i] === pw.word[j]) {
                        // Potential intersection
                        // pw is at pw.row, pw.col. Letter j is at ...
                        const intersectR = pw.isAcross ? pw.row : pw.row + j;
                        const intersectC = pw.isAcross ? pw.col + j : pw.col;

                        // If new word intersects at its index i:
                        // New word start position:
                        const startR = pw.isAcross ? intersectR - i : intersectR; // If pw is across, we must be down
                        const startC = pw.isAcross ? intersectC : intersectC - i; // If pw is down, we must be across

                        const newIsAcross = !pw.isAcross;

                        if (canPlace(word, startR, startC, newIsAcross)) {
                            place(word, startR, startC, newIsAcross);
                            placedWords.push({ ...item, word, row: startR, col: startC, isAcross: newIsAcross, number: 0 });
                            placed = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    // 4. Crop and number
    if (placedWords.length === 0) return null;

    // Find bounds
    let minR = GRID_SIZE, maxR = 0, minC = GRID_SIZE, maxC = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] !== "") {
                minR = Math.min(minR, r);
                maxR = Math.max(maxR, r);
                minC = Math.min(minC, c);
                maxC = Math.max(maxC, c);
            }
        }
    }

    // Crop grid
    const width = maxC - minC + 1;
    const height = maxR - minR + 1;
    const finalGrid = Array(height).fill(null).map(() => Array(width).fill(""));

    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            finalGrid[r][c] = grid[minR + r][minC + c];
        }
    }

    // Adjust word coordinates and assign numbers
    // Sort placed words by position (top-left to bottom-right) to assign numbers logically
    placedWords.forEach(w => {
        w.row -= minR;
        w.col -= minC;
    });

    // Assign numbers
    // A cell gets a number if it is the start of an Across word or a Down word
    let counter = 1;
    // We need to map start positions to numbers
    const numberMap = new Map<string, number>();

    // Sort by row then col to assign numbers in reading order
    const starts = placedWords.map(w => `${w.row},${w.col}`).sort((a, b) => {
        const [r1, c1] = a.split(',').map(Number);
        const [r2, c2] = b.split(',').map(Number);
        if (r1 !== r2) return r1 - r2;
        return c1 - c2;
    });

    // Unique starts
    const uniqueStarts = [...new Set(starts)];

    uniqueStarts.forEach(s => {
        numberMap.set(s, counter++);
    });

    placedWords.forEach(w => {
        w.number = numberMap.get(`${w.row},${w.col}`) || 0;
    });

    return {
        width,
        height,
        grid: finalGrid,
        words: placedWords
    };
}

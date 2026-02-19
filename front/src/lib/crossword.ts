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

// Helper to check if a word fits
function canPlace(grid: string[][], word: string, r: number, c: number, direction: 'across' | 'down'): boolean {
    const height = grid.length;
    const width = grid[0].length;
    const isAcross = direction === 'across';

    // 1. Boundary check
    if (r < 0 || c < 0 || r >= height || c >= width) return false;
    if (isAcross && c + word.length > width) return false;
    if (!isAcross && r + word.length > height) return false;

    // 2. Check overlap and conflicts
    for (let i = 0; i < word.length; i++) {
        const cr = isAcross ? r : r + i;
        const cc = isAcross ? c + i : c;
        const cell = grid[cr][cc];

        // Conflict: cell occupied by different letter
        if (cell !== "" && cell !== word[i]) return false;
    }

    // 3. Check adjacency (ensure we don't accidentally merge with other words)
    // We need to check the cells surrounding the word.
    // If a cell is empty (was not an intersection), its perpendicular neighbors must also be empty.

    // Check cell before start
    const beforeR = isAcross ? r : r - 1;
    const beforeC = isAcross ? c - 1 : c;
    if (beforeR >= 0 && beforeR < height && beforeC >= 0 && beforeC < width && grid[beforeR][beforeC] !== "") return false;

    // Check cell after end
    const afterR = isAcross ? r : r + word.length;
    const afterC = isAcross ? c + word.length : c;
    if (afterR >= 0 && afterR < height && afterC >= 0 && afterC < width && grid[afterR][afterC] !== "") return false;

    for (let i = 0; i < word.length; i++) {
        const cr = isAcross ? r : r + i;
        const cc = isAcross ? c + i : c;
        const cell = grid[cr][cc];

        if (cell === "") {
            // This cell is currently empty, so we are placing a new letter here.
            // We must ensure there are no perpendicular neighbors, otherwise we create a 2-letter word.
            const n1r = isAcross ? cr - 1 : cr;
            const n1c = isAcross ? cc : cc - 1;
            const n2r = isAcross ? cr + 1 : cr;
            const n2c = isAcross ? cc : cc + 1;

            if (n1r >= 0 && n1r < height && n1c >= 0 && n1c < width && grid[n1r][n1c] !== "") return false;
            if (n2r >= 0 && n2r < height && n2c >= 0 && n2c < width && grid[n2r][n2c] !== "") return false;
        }
    }

    return true;
}

function placeWord(grid: string[][], word: string, r: number, c: number, direction: 'across' | 'down') {
    const isAcross = direction === 'across';
    for (let i = 0; i < word.length; i++) {
        const cr = isAcross ? r : r + i;
        const cc = isAcross ? c + i : c;
        grid[cr][cc] = word[i];
    }
}

export function generateCrosswordLayout(wordsData: { word: string; clue: string }[]): CrosswordGrid | null {
    const GRID_SIZE = 30; // working size, will crop later
    let bestResult: { grid: string[][], placedWords: any[] } | null = null;

    // 1. Try 10 times to find the best layout
    for (let attempt = 0; attempt < 10; attempt++) {
        const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(""));
        const placedWords: any[] = [];

        // 2. Sort words
        // Primary sort by length (desc), Secondary randomization for variety
        const shuffled = [...wordsData]
            .map(w => ({ ...w, word: w.word.toUpperCase() }))
            .sort((a, b) => b.word.length - a.word.length);

        if (attempt > 0) {
            // Keep longest first, but shuffle equals? Or just slight shuffle?
            // Let's shuffle the whole list slightly but weight by length
            shuffled.sort(() => Math.random() - 0.5);
            // Re-sort roughly by length to keep packing efficient
            shuffled.sort((a, b) => (b.word.length - a.word.length) + (Math.random() * 2 - 1));
        }

        // 3. Place first word in center
        if (shuffled.length > 0) {
            const first = shuffled[0];
            const r = Math.floor(GRID_SIZE / 2);
            const c = Math.floor((GRID_SIZE - first.word.length) / 2);
            // First word always ACROSS for symmetry
            if (canPlace(grid, first.word, r, c, 'across')) {
                placeWord(grid, first.word, r, c, 'across');
                placedWords.push({ ...first, row: r, col: c, isAcross: true });
            }
        }

        // 4. Try to fit remaining words
        for (let i = 1; i < shuffled.length; i++) {
            const wordObj = shuffled[i];
            let bestMove: { r: number, c: number, dir: 'across' | 'down' } | null = null;

            // Try to find ANY intersection with ANY already placed word
            // We want to minimize grid expansion, so maybe prioritize closeness to center?
            // For now, valid intersection is enough.

            // Iterate through all placed words
            // To add variety, shuffle placedWords order for checking?
            const shuffledPlaced = [...placedWords].sort(() => Math.random() - 0.5);

            for (const pw of shuffledPlaced) {
                if (bestMove) break; // Greedy: take first valid fit? or best fit? 
                // Let's try to take first valid fit to simulate "growing"

                for (let j = 0; j < pw.word.length; j++) {
                    const letter = pw.word[j];

                    // Does the new word have this letter?
                    for (let k = 0; k < wordObj.word.length; k++) {
                        if (wordObj.word[k] === letter) {
                            // Proposed intersection at pw's j-th letter and new word's k-th letter
                            // pw is at pw.row, pw.col
                            const intersectR = pw.isAcross ? pw.row : pw.row + j;
                            const intersectC = pw.isAcross ? pw.col + j : pw.col;

                            // New word direction must be perpendicular
                            const newDir = pw.isAcross ? 'down' : 'across';
                            const isNewAcross = newDir === 'across';

                            // Calculate new word start position
                            const startR = isNewAcross ? intersectR : intersectR - k;
                            const startC = isNewAcross ? intersectC - k : intersectC;

                            if (canPlace(grid, wordObj.word, startR, startC, newDir)) {
                                bestMove = { r: startR, c: startC, dir: newDir };
                                break;
                            }
                        }
                    }
                    if (bestMove) break;
                }
            }

            if (bestMove) {
                placeWord(grid, wordObj.word, bestMove.r, bestMove.c, bestMove.dir);
                placedWords.push({ ...wordObj, row: bestMove.r, col: bestMove.c, isAcross: bestMove.dir === 'across' });
            }
        }

        // Evaluate this layout: simply number of words placed
        if (!bestResult || placedWords.length > bestResult.placedWords.length) {
            bestResult = { grid, placedWords };
        }
    }

    if (!bestResult || bestResult.placedWords.length === 0) return null;

    // 5. Finalize: Crop and Number
    const { grid, placedWords } = bestResult;

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

    const width = maxC - minC + 1;
    const height = maxR - minR + 1;
    const finalGrid = Array(height).fill(null).map(() => Array(width).fill(""));

    // Copy to new grid
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            finalGrid[r][c] = grid[minR + r][minC + c];
        }
    }

    // Adjust word coordinates
    placedWords.forEach(w => {
        w.row -= minR;
        w.col -= minC;
    });

    // Assign numbers (Standard Crossword Numbering)
    // 1. Sort all "start positions" by row, then col
    // 2. Iterate through grid cells (left-right, top-bottom)
    // 3. If a cell is a start of any word, assign it a number

    // We need to know which word starts where
    const wordStarts = new Map<string, any[]>(); // "r,c" -> [wordObj, ...]
    placedWords.forEach(w => {
        const key = `${w.row},${w.col}`;
        if (!wordStarts.has(key)) wordStarts.set(key, []);
        wordStarts.get(key)!.push(w);
    });

    let currentNumber = 1;
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            const key = `${r},${c}`;
            if (wordStarts.has(key)) {
                // Assign this number to all words starting here
                const wordsStartingHere = wordStarts.get(key)!;
                let assigned = false;
                wordsStartingHere.forEach(w => {
                    w.number = currentNumber;
                    assigned = true;
                });
                if (assigned) currentNumber++;
            }
        }
    }

    return {
        width,
        height,
        grid: finalGrid,
        words: placedWords
    };
}


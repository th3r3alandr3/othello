export default class OthelloAi {
    private readonly player: number;
    private readonly maxDepth: number = 1000;
    private readonly maxTime: number = 5000;
    private startTime: number = 0;

    constructor(private board: any[][], player: number) {
        this.player = player;
    }

    getNextMove(): Promise<[number, number]> {
        const possibleMoves = this.getPossibleMoves();
        const moveQueue = possibleMoves.sort((a, b) => b[1] - a[1]).map(m => m[0]);
        let bestScore = -Infinity;
        let bestMove: [number, number] = [-1, -1];
        this.startTime = Date.now();
        while (moveQueue.length > 0) {
            const [row, col] = moveQueue.shift()!;
            const boardCopy = this.copyBoard(this.board);
            this.flip(this.board, row, col, this.player);
            const remainingTime = this.maxTime - (Date.now() - this.startTime);
            const score = this.alphaBeta(
                this.maxDepth,
                -Infinity,
                Infinity,
                false,
                remainingTime
            );
            this.board = boardCopy;
            if (score > bestScore) {
                bestScore = score;
                console.log('OthelloAiV2 bestScore: ' + bestScore);
                bestMove = [row, col];
            }
            if (Date.now() - this.startTime >= this.maxTime) {
                break;
            }
        }
        return Promise.resolve().then(() => {
            return bestMove;
        });
    }

    private getPossibleMoves(): [ [number, number], number ][] {
        const possibleMoves: [ [number, number], number ][] = [];
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[0].length; col++) {
                if (this.canFlip(this.board, row, col, this.player)) {
                    const boardCopy = this.copyBoard(this.board);
                    this.flip(this.board, row, col, this.player);
                    const score = this.evaluateBoard();
                    this.board = boardCopy;
                    possibleMoves.push([[row, col], score]);
                }
            }
        }
        return possibleMoves;
    }

    private alphaBeta(
        depth: number,
        alpha: number,
        beta: number,
        maximizingPlayer: boolean,
        remainingTime: number
    ): number {
        if (depth === 0 || this.isGameOver() || remainingTime <= 0) {
            console.log('OthelloAiV2 alphaBeta depth: ' + depth + ', remainingTime: ' + remainingTime, ', gameOver: ' + this.isGameOver());
            return this.evaluateBoard();
        }

        if (maximizingPlayer) {
            let value = -Infinity;
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[0].length; col++) {
                    if (this.canFlip(this.board, row, col, this.player)) {
                        const boardCopy = this.copyBoard(this.board);
                        this.flip(this.board, row, col, this.player);
                        value = Math.max(
                            value,
                            this.alphaBeta(depth - 1, alpha, beta, false, remainingTime - (Date.now() - this.startTime))
                        );
                        this.board = boardCopy;
                        alpha = Math.max(alpha, value);
                        if (alpha >= beta) {
                            return value;
                        }
                    }
                }
            }
            return value;
        } else {
            let value = Infinity;
            const player = this.player === 1 ? 0 : 1
            for (let row = 0; row < this.board.length; row++) {
                for (let col = 0; col < this.board[0].length; col++) {
                    if (this.canFlip(this.board, row, col, player)) {
                        const boardCopy = this.copyBoard(this.board);
                        this.flip(this.board, player, row, col);
                        value = Math.min(
                            value,
                            this.alphaBeta(depth - 1, alpha, beta, true, remainingTime - (Date.now() - this.startTime))
                        );
                        this.board = boardCopy;
                        beta = Math.min(beta, value);
                        if (beta <= alpha) {
                            return value;
                        }
                    }
                }
            }
            return value;
        }
    }


    private copyBoard(board: any[][]): number[][] {
        const copy = [];
        for (let i = 0; i < board.length; i++) {
            copy[i] = board[i].slice();
        }
        return copy;
    }

    evaluateBoard(): number {
        let score = 0;
        const opponent = this.player === 1 ? 0 : 1;

        const specialFields = [
            [[0, 1, -20], [0, 2, 5], [0, 3, 5], [0, 4, 5], [0, 5, 5], [0, 6, -20]],
            [[1, 0, -20], [2, 0, 5], [3, 0, 5], [4, 0, 5], [5, 0, 5], [6, 0, -20]],
            [[7, 1, -20], [7, 2, 5], [7, 3, 5], [7, 4, 5], [7, 5, 5], [7, 6, -20]],
            [[1, 7, -20], [2, 7, 5], [3, 7, 5], [4, 7, 5], [5, 7, 5], [6, 7, -20]],
            [[1, 1, -30], [1, 6, -30], [6, 1, -30], [6, 6, -30]],
            [[0, 0, 50], [0, 7, 50], [7, 0, 50], [7, 7, 50]]
        ];
        for (const field of specialFields) {
            let playerCount = 0;
            let opponentCount = 0;
            for (const [row, col, score] of field) {
                if (this.board[row][col] === this.player) {
                    playerCount += score;
                } else if (this.board[row][col] === opponent) {
                    opponentCount += score;
                }
            }
            score += playerCount;
            score -= opponentCount;
        }

        // Evaluate remaining squares
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[0].length; col++) {
                if (this.board[row][col] === this.player) {
                    score++;
                } else if (this.board[row][col] === opponent) {
                    score--;
                }
            }
        }

        return score;
    }


    private isGameOver(): boolean {
        const isGameOver = (
            this.isBoardFull() ||
            !this.canPlayerMove(this.player) ||
            !this.canPlayerMove(this.player === 1 ? 0 : 1)
        );
        console.log('OthelloAiV2 isGameOver: ' + isGameOver);
        return isGameOver;
    }

    private isBoardFull(): boolean {
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[0].length; col++) {
                if (this.board[row][col] === null) {
                    return false;
                }
            }
        }
        return true;
    }

    private canPlayerMove(player: number): boolean {
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[0].length; col++) {
                if (this.canFlip(this.board, row, col, player)) {
                    return true;
                }
            }
        }
        return false;
    }

    private flip(board: any[][], player: number, row: number, col: number): boolean {
        if (board[row][col] !== null) {
            return false;
        }

        let canFlip = false;

        // check all directions
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) {
                    continue;
                }

                let r = row + dr;
                let c = col + dc;
                let foundOpponent = false;

                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    if (board[r][c] === null) {
                        break;
                    } else if (board[r][c] === player) {
                        if (foundOpponent) {
                            canFlip = true;
                            while (r !== row || c !== col) {
                                r -= dr;
                                c -= dc;
                                board[r][c] = player;
                            }
                        }
                        break;
                    } else {
                        foundOpponent = true;
                    }

                    r += dr;
                    c += dc;
                }
            }
        }

        return canFlip;
    }

    private canFlip(board: any[][], row: number, col: number, color: number): boolean {
        if (board[row][col] !== null) {
            return false;
        }

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) {
                    continue;
                }

                let nx = row + dx;
                let ny = col + dy;
                let captured: { x: number, y: number }[] = [];

                while (nx >= 0 && nx < board.length && ny >= 0 && ny < board[0].length) {
                    if (board[nx][ny] === null) {
                        break;
                    }
                    if (board[nx][ny] === color) {
                        if (captured.length > 0) {
                            return true;
                        }
                        break;
                    } else {
                        captured.push({x: nx, y: ny});
                    }
                    nx += dx;
                    ny += dy;
                }
            }
        }

        return false;
    }
}

import * as THREE from "three";
import OthelloAI from "~/TypeScript/OthelloAi";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Token from "~/TypeScript/Token";

export default class Othello {
    private readonly scene: THREE.Scene;

    private readonly camera: THREE.PerspectiveCamera;

    private readonly container: HTMLElement;

    private readonly cylinderGeometry: THREE.CylinderGeometry;

    private readonly upperCylinderMaterial: THREE.MeshPhongMaterial;

    private readonly lowerCylinderMaterial: THREE.MeshPhongMaterial;

    private movingCircle: THREE.Group;

    private raycaster = new THREE.Raycaster();

    private pointer = new THREE.Vector2();

    private mouse = new THREE.Vector2();

    private currentPlayer = 0;

    private gameEnded = false;

    private endGameMessage = '';

    private readonly colors = {
        0: 0x000000,
        1: 0xffffff,
    } as Record<number, number>

    private readonly invertedColors = {
        0: 0xffffff,
        1: 0x000000,
    } as Record<number, number>

    private readonly board = [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, 0, 1, null, null, null],
        [null, null, null, 1, 0, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
    ]

    private previousBoard = [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
    ];


    constructor() {
        this.camera = new THREE.PerspectiveCamera(75, document.body.clientWidth / document.body.clientHeight, 0.1, 1000);
        this.scene = new THREE.Scene();

        this.cylinderGeometry = new THREE.CylinderGeometry(.4, .4, .035, 32);
        this.upperCylinderMaterial = new THREE.MeshPhongMaterial({color: this.colors[this.currentPlayer], opacity: 1, transparent: true});
        this.lowerCylinderMaterial = new THREE.MeshPhongMaterial({color: this.invertedColors[this.currentPlayer], opacity: 1, transparent: true});

        this.movingCircle = this.placeToken(-1, -1, this.currentPlayer)
        this.container = <HTMLDivElement>document.getElementById('scene');

        this.initScene();
        this.initGrid();
        this.addGround();
        this.addLight();
        this.boardToCanvas();
    }

    public restart() {
        window.location.reload();
    }

    get sates() {
        return {
            board: this.board,
            gameEnded: this.gameEnded,
            endGameMessage: this.endGameMessage,
            whiteScore: this.board.reduce((acc, row) => acc + row.filter((value) => value === 1).length, 0),
            blackScore: this.board.reduce((acc, row) => acc + row.filter((value) => value === 0).length, 0),
        }
    }

    private initScene() {
        this.scene.background = new THREE.Color(0xffffff)

        this.camera.position.z = 0;
        this.camera.position.y = 5;
        this.camera.position.x = 7;

        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, logarithmicDepthBuffer: true});
        renderer.physicallyCorrectLights = true;
        renderer.shadowMap.enabled = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0xffffff, 1);
        renderer.setSize(document.body.clientWidth, document.body.clientHeight);

        const controls = new OrbitControls(this.camera, renderer.domElement);
        controls.minDistance = 5;
        controls.maxDistance = 15;
        controls.maxPolarAngle = Math.PI / 2;


        this.container.appendChild(renderer.domElement);
        this.container.addEventListener('click', () => this.onClick(this.mouse.x, this.mouse.y));

        this.movingCircle.position.y = -1;
        this.scene.add(this.movingCircle);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(this.scene, this.camera);
        };
        animate();
    }

    private async onClick(x: number, y: number) {
        if (this.gameEnded) {
            return;
        }
        if (this.placeStone(x, y)) {
            this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
        }
        this.movingCircle.removeFromParent();

        switch (this.checkGameOver()) {
            case 0:
                this.gameEnded = true;
                this.endGameMessage = 'Schwarz hat gewonnen';
                break;
            case 1:
                this.gameEnded = true;
                this.endGameMessage = 'Weiß hat gewonnen';
                break;
            case 2:
                this.gameEnded = true;
                this.endGameMessage = 'Unentschieden';
                break;
            default:
                if (!this.turnsLeft()) {
                    // alert('Spieler kann keine Steine mehr setzen. Nächster Spieler ist an der Reihe.');
                    this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
                }
                if (this.currentPlayer === 1) {
                    const ai = new OthelloAI(this.copyBoard(this.board), this.currentPlayer);
                    setTimeout(async () => {
                        const [row, col] = await ai.getNextMove();
                        await this.onClick(row, col);
                    }, 500);
                } else {
                    this.movingCircle = this.placeToken(-1, -1, this.currentPlayer)
                    this.movingCircle.position.y = -1;
                    this.scene.add(this.movingCircle);
                }
                break;
        }
    }

    private turnsLeft() {
        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[0].length; j++) {
                if (this.board[i][j] === null) {
                    if (this.canFlip(i, j, this.currentPlayer)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private placeStone(x: number, y: number): boolean {
        if (this.board[x][y] !== null) {
            return false;
        }

        let flipped = false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) {
                    continue;
                }

                let nx = x + dx;
                let ny = y + dy;
                let captured: { x: number, y: number }[] = [];

                while (nx >= 0 && nx < this.board.length && ny >= 0 && ny < this.board[0].length) {
                    if (this.board[nx][ny] === null) {
                        break;
                    }
                    if (this.board[nx][ny] === this.currentPlayer) {
                        if (captured.length > 0) {
                            flipped = true;
                            captured.forEach((pos) => {
                                this.setStone(pos.x, pos.y, this.currentPlayer);
                            });
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

        if (flipped) {
            this.setStone(x, y, this.currentPlayer);
            return true;
        } else {
            return false;
        }

    }

    private checkGameOver(): number | null {
        let blackCount = 0;
        let whiteCount = 0;
        let emptyCount = 0;

        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[0].length; j++) {
                if (this.board[i][j] === null) {
                    emptyCount++;
                    continue;
                }
                if (this.board[i][j] === 0) {
                    blackCount++;
                } else {
                    whiteCount++;
                }
            }
        }

        if (emptyCount === 0) {
            if (blackCount > whiteCount) {
                return 0;
            } else if (whiteCount > blackCount) {
                return 1;
            } else {
                return 2;
            }
        }

        return null;
    }

    private canFlip(row: number, col: number, color: number): boolean {
        if (this.board[row][col] !== null) {
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

                while (nx >= 0 && nx < this.board.length && ny >= 0 && ny < this.board[0].length) {
                    if (this.board[nx][ny] === null) {
                        break;
                    }
                    if (this.board[nx][ny] === color) {
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


    private initGrid() {
        const gridHelper = new THREE.GridHelper(8, 8, 0x000000, 0x000000);
        gridHelper.position.y = 0.01;
        gridHelper.name = 'grid';
        this.scene.add(gridHelper);
    }

    private addLight() {
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 10, 0);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500;
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
    }

    private addGround() {
        const feltTexture = new THREE.TextureLoader().load("textures/felt-fabric-texture.jpg");
        const fieldGround = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 8),
            new THREE.MeshStandardMaterial({color: 0x007669, map: feltTexture})
        );
        fieldGround.rotation.x = -Math.PI / 2;
        fieldGround.receiveShadow = true;
        this.scene.add(fieldGround);


        document.addEventListener('pointermove', (event) => {
            this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersects = this.raycaster.intersectObject(fieldGround);
            if (intersects.length > 0) {
                const posX = Math.floor(intersects[0].point.x) + .5;
                const posZ = Math.floor(intersects[0].point.z) + .5;
                this.mouse.x = posX + 3.5;
                this.mouse.y = posZ + 3.5;
                if (this.board[this.mouse.x][this.mouse.y] === null) {
                    this.movingCircle.position.x = posX;
                    this.movingCircle.position.z = posZ;
                    this.movingCircle.position.y = 0.01;
                }
            }
        }, false);

        const texture = new THREE.TextureLoader().load("textures/Wood_027_basecolor.jpg");
        const normals = new THREE.TextureLoader().load("textures/Wood_027_normal.jpg");
        const roughness = new THREE.TextureLoader().load("textures/Wood_027_roughness.jpg");
        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(8.5, 8.5, .5),
            new THREE.MeshStandardMaterial({map: texture, normalMap: normals, roughnessMap: roughness})
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.251;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    private boardToCanvas() {
        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {
                if (this.board[i][j] !== null && this.previousBoard[i][j] !== this.board[i][j]) {
                    this.placeToken(i, j, <number>this.board[i][j]);
                }
            }
        }

        this.previousBoard = this.copyBoard(this.board);
    }


    private placeToken(x: number, y: number, player: number): THREE.Group {
        const position = new THREE.Vector3(x - 3.5, .02, y - 3.5);
        const tokenName = `token_${x}_${y}`;
        let token = this.scene.getObjectByName(tokenName) as Token;
        if (token === undefined) {
            token = new Token(this.cylinderGeometry, this.upperCylinderMaterial, this.lowerCylinderMaterial, player, position, tokenName);
            this.scene.add(token);
        } else {
            token.owningPlayer = player;
        }

        return token;
    }

    private copyBoard(board: any[][]): any[][] {
        const copy = [];
        for (let i = 0; i < board.length; i++) {
            copy[i] = board[i].slice();
        }
        return copy;
    }

    private setStone(x: number, y: number, currentColor: number) {
        this.board[x][y] = currentColor;
        this.placeToken(x, y, currentColor);
    }
}

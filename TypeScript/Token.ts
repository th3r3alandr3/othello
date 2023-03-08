import * as THREE from "three";
import {gsap} from "gsap";

export default class Token extends THREE.Group {
    private readonly upperCylinder: THREE.Mesh;

    private readonly lowerCylinder: THREE.Mesh;

    private readonly upperMaterial: THREE.Material;
    private readonly lowerMaterial: THREE.Material;

    private _owningPlayer: number;

    constructor(geometry: THREE.BufferGeometry, upperMaterial: THREE.Material, lowerMaterial: THREE.Material, player: number, position: THREE.Vector3, name: string) {
        super();

        this.upperMaterial = upperMaterial;
        this.lowerMaterial = lowerMaterial;

        this.upperCylinder = new THREE.Mesh(geometry);
        this.upperCylinder.material = player === 0 ? upperMaterial : lowerMaterial;
        this.upperCylinder.position.y = .035;
        this.lowerCylinder = new THREE.Mesh(geometry);
        this.lowerCylinder.material = player === 0 ? lowerMaterial : upperMaterial;
        this._owningPlayer = player;

        this.add(this.upperCylinder);
        this.add(this.lowerCylinder);

        this.position.copy(position);
        this.name = name;
        this.castShadow = true;
        this.receiveShadow = true;

        this.position.y = .035;
    }

    get owningPlayer(): number {
        return this._owningPlayer;
    }

    set owningPlayer(value: number) {
        console.log('set owningPlayer');
        if(this._owningPlayer !== value) {
            this.flip();
        }
        this._owningPlayer = value;
    }

    public setPositionByRowAndColumn(row: number, column: number): void {
        this.position.x = column - 3.5;
        this.position.z = row - 3.5;
    }

    private flip(): void {
        console.log('flip');
        const timeline = gsap.timeline();
        timeline.to(this.position, {
            y: .25,
            ease: 'Power4.easeInOut',
            duration: .125,
        });
        timeline.to(this.rotation, {
            z: Math.PI,
            ease: 'Power4.easeInOut',
            duration: .25,
        });
        timeline.to(this.position, {
            y: .07,
            ease: 'Power4.easeInOut',
            duration: .125,
        });
        timeline.play();
        this.rotation.z = 0;
        this.upperCylinder.material = this._owningPlayer === 0 ? this.upperMaterial : this.lowerMaterial;
        this.lowerCylinder.material = this._owningPlayer === 0 ? this.lowerMaterial : this.upperMaterial;
    }
}

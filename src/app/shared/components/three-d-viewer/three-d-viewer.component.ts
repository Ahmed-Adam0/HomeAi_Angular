import { Component, ElementRef, Input, OnInit, AfterViewInit, OnDestroy, ViewChild, PLATFORM_ID, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';

// We will import * as THREE dynamically or directly if installed.
// To avoid SSR import issues and make it safe, we check isPlatformBrowser.
import * as THREE from 'three';

@Component({
  selector: 'app-three-d-viewer',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="viewer-container" #container>
      <div *ngIf="isLoading()" class="viewer-loader">
        <div class="loader-spinner"></div>
        <span class="loader-text">Loading 3D Model...</span>
      </div>
      <canvas #rendererCanvas class="three-canvas"></canvas>
      <div class="viewer-instructions" *ngIf="!isLoading()">
        <span>Drag to rotate | Scroll to zoom</span>
      </div>
    </div>
  `,
  styles: [`
    .viewer-container {
      position: relative;
      width: 100%;
      height: 250px;
      background: linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    .three-canvas {
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
      outline: none;
    }
    .three-canvas:active {
      cursor: grabbing;
    }
    .viewer-loader {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(250, 250, 249, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      gap: 12px;
    }
    .loader-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(184, 147, 92, 0.15);
      border-top-color: #b8935c;
      border-radius: 50%;
      animation: spin 1s infinite linear;
    }
    .loader-text {
      font-size: 13px;
      color: #70675a;
      font-family: var(--fm-font-sans, sans-serif);
      font-weight: 500;
      letter-spacing: 0.02em;
    }
    .viewer-instructions {
      position: absolute;
      bottom: 8px;
      left: 0;
      width: 100%;
      text-align: center;
      pointer-events: none;
      z-index: 5;
    }
    .viewer-instructions span {
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(0, 0, 0, 0.05);
      color: #8c8375;
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 20px;
      font-family: var(--fm-font-sans, sans-serif);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.8;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ThreeDViewerComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('rendererCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() productType: 'sofa' | 'chair' | 'table' | 'lamp' | string = 'sofa';
  @Input() glbUrl?: string;

  private platformId = inject(PLATFORM_ID);
  
  readonly isLoading = signal<boolean>(true);

  // Three.js instances
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private modelGroup!: THREE.Group;
  private animationFrameId?: number;

  // Interaction variables
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private autoRotateSpeed = 0.003;
  private lastInteractionTime = 0;
  private currentRotation = { x: 0.2, y: 0.5 }; // initial rotation angles

  private resizeObserver?: ResizeObserver;

  ngOnInit(): void {
    // SSR safety
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Small timeout to allow container layouts to resolve
      setTimeout(() => {
        this.initThree();
        this.loadOrBuildModel();
        this.animate();
        this.setupInteraction();
        this.setupResizeHandler();
      }, 50);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productType'] && !changes['productType'].firstChange) {
      if (isPlatformBrowser(this.platformId) && this.scene) {
        this.loadOrBuildModel();
      }
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.cleanupInteraction();
      this.resizeObserver?.disconnect();
      
      // Dispose geometry and materials
      if (this.modelGroup) {
        this.disposeObject(this.modelGroup);
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
    }
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;

    // 1. Create Scene
    this.scene = new THREE.Scene();
    // Transparent background to match container styles
    this.scene.background = null;

    // 2. Create Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 1.2, 2.6);
    this.camera.lookAt(0, 0.4, 0);

    // 3. Create Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Create Group for models
    this.modelGroup = new THREE.Group();
    this.modelGroup.position.set(0, 0, 0);
    this.scene.add(this.modelGroup);

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.bias = -0.001;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xebe2d5, 0.4); // soft warm fill light
    dirLight2.position.set(-5, 5, -5);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 3, 2);
    this.scene.add(pointLight);

    // Add a soft subtle grid helper/shadow plane on the floor to ground the model
    const floorGeo = new THREE.PlaneGeometry(3, 3);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const floorPlane = new THREE.Mesh(floorGeo, floorMat);
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.position.y = 0;
    floorPlane.receiveShadow = true;
    this.scene.add(floorPlane);
  }

  private loadOrBuildModel(): void {
    this.isLoading.set(true);

    // Clear previous children in the group
    while (this.modelGroup.children.length > 0) {
      const child = this.modelGroup.children[0];
      this.modelGroup.remove(child);
      this.disposeObject(child);
    }

    // Reset rotation
    this.modelGroup.rotation.set(this.currentRotation.x, this.currentRotation.y, 0);

    // Fallback: If a GLB URL is specified, try loading it (standard placeholder for GLTF Loader)
    if (this.glbUrl) {
      // Dynamic import of GLTFLoader to keep package sizes optimal
      import('three/examples/jsm/loaders/GLTFLoader.js').then((module) => {
        const loader = new module.GLTFLoader();
        loader.load(
          this.glbUrl!,
          (gltf) => {
            const model = gltf.scene;
            
            // Auto center and scale model
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            // Adjust height so it sits on floor
            model.position.x = -center.x;
            model.position.y = -box.min.y;
            model.position.z = -center.z;
            
            // Scale model to fit inside a bounding sphere of radius 1
            const maxDimension = Math.max(size.x, size.y, size.z);
            const scale = 1.1 / maxDimension;
            model.scale.set(scale, scale, scale);
            
            // Enable shadows
            model.traverse((node: any) => {
              if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
              }
            });

            this.modelGroup.add(model);
            this.isLoading.set(false);
          },
          undefined,
          (err) => {
            console.warn('GLTF loading failed, using high-end procedural fallback model instead.', err);
            this.buildProceduralModel();
          }
        );
      }).catch((e) => {
        console.warn('GLTFLoader module load error. Using procedural rendering.', e);
        this.buildProceduralModel();
      });
    } else {
      // Build premium procedural 3D furniture
      this.buildProceduralModel();
    }
  }

  private buildProceduralModel(): void {
    const type = this.productType.toLowerCase();

    // Refined color materials matching HomeAI theme
    const fabricColor = 0xe6d6c3; // light cashmere beige
    const woodColor = 0x5c4a37; // walnut wood
    const metalColor = 0xb8935c; // gold brass accent
    const seatColor = 0x70675a; // dark taupe
    
    // Materials
    const fabricMaterial = new THREE.MeshStandardMaterial({
      color: fabricColor,
      roughness: 0.8,
      metalness: 0.1
    });

    const darkFabricMaterial = new THREE.MeshStandardMaterial({
      color: seatColor,
      roughness: 0.85,
      metalness: 0.05
    });

    const woodMaterial = new THREE.MeshStandardMaterial({
      color: woodColor,
      roughness: 0.6,
      metalness: 0.1
    });

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: metalColor,
      roughness: 0.25,
      metalness: 0.85
    });

    const blackMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x242220,
      roughness: 0.4,
      metalness: 0.8
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.05,
      metalness: 0.95
    });

    const emissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffae6,
      emissive: 0xfff0b3,
      emissiveIntensity: 1.5,
      roughness: 0.1
    });

    const pivotGroup = new THREE.Group();

    if (type.includes('sofa') || type.includes('lounge') || type.includes('أريكة') || type.includes('كنبة')) {
      // --- Premium Sofa Model ---
      // Base frame
      const baseGeo = new THREE.BoxGeometry(1.6, 0.15, 0.75);
      const baseMesh = new THREE.Mesh(baseGeo, fabricMaterial);
      baseMesh.position.y = 0.175;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      pivotGroup.add(baseMesh);

      // Backrest
      const backGeo = new THREE.BoxGeometry(1.6, 0.5, 0.15);
      const backMesh = new THREE.Mesh(backGeo, fabricMaterial);
      backMesh.position.set(0, 0.5, -0.3);
      backMesh.castShadow = true;
      backMesh.receiveShadow = true;
      pivotGroup.add(backMesh);

      // Left Armrest
      const armLeftGeo = new THREE.BoxGeometry(0.15, 0.4, 0.75);
      const armLeftMesh = new THREE.Mesh(armLeftGeo, fabricMaterial);
      armLeftMesh.position.set(-0.725, 0.35, 0);
      armLeftMesh.castShadow = true;
      armLeftMesh.receiveShadow = true;
      pivotGroup.add(armLeftMesh);

      // Right Armrest
      const armRightMesh = armLeftMesh.clone();
      armRightMesh.position.x = 0.725;
      pivotGroup.add(armRightMesh);

      // Seat Cushions (two cushions)
      const seatGeo = new THREE.BoxGeometry(0.62, 0.12, 0.58);
      const seatCushionLeft = new THREE.Mesh(seatGeo, darkFabricMaterial);
      seatCushionLeft.position.set(-0.325, 0.28, 0.05);
      seatCushionLeft.castShadow = true;
      seatCushionLeft.receiveShadow = true;
      pivotGroup.add(seatCushionLeft);

      const seatCushionRight = seatCushionLeft.clone();
      seatCushionRight.position.x = 0.325;
      pivotGroup.add(seatCushionRight);

      // Backrest cushions
      const backCushionGeo = new THREE.BoxGeometry(0.62, 0.38, 0.1);
      const backCushionLeft = new THREE.Mesh(backCushionGeo, fabricMaterial);
      backCushionLeft.position.set(-0.325, 0.5, -0.185);
      backCushionLeft.rotation.x = -0.05;
      backCushionLeft.castShadow = true;
      pivotGroup.add(backCushionLeft);

      const backCushionRight = backCushionLeft.clone();
      backCushionRight.position.x = 0.325;
      pivotGroup.add(backCushionRight);

      // Wooden Legs
      const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.12);
      const legOffsets = [
        { x: -0.73, z: -0.3 },
        { x: 0.73, z: -0.3 },
        { x: -0.73, z: 0.3 },
        { x: 0.73, z: 0.3 }
      ];
      legOffsets.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, woodMaterial);
        leg.position.set(pos.x, 0.06, pos.z);
        leg.rotation.z = pos.x > 0 ? -0.1 : 0.1;
        leg.castShadow = true;
        pivotGroup.add(leg);
      });

    } else if (type.includes('chair') || type.includes('lounge') || type.includes('كرسي') || type.includes('مقعد')) {
      // --- Premium Chair Model ---
      // Base circle swivel stand
      const baseStandGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.03, 32);
      const baseStand = new THREE.Mesh(baseStandGeo, goldMaterial);
      baseStand.position.y = 0.015;
      baseStand.castShadow = true;
      pivotGroup.add(baseStand);

      // Swivel stem
      const stemGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.15, 16);
      const stem = new THREE.Mesh(stemGeo, goldMaterial);
      stem.position.y = 0.1;
      stem.castShadow = true;
      pivotGroup.add(stem);

      // Seat shell group
      const seatShell = new THREE.Group();
      seatShell.position.y = 0.25;

      // Bottom support ring
      const ringGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 32);
      const ring = new THREE.Mesh(ringGeo, goldMaterial);
      ring.position.y = 0.02;
      ring.castShadow = true;
      seatShell.add(ring);

      // Curved seat back / side bucket
      const seatBackGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.45, 32, 1, true, -Math.PI * 0.8, Math.PI * 1.6);
      const seatBack = new THREE.Mesh(seatBackGeo, fabricMaterial);
      seatBack.position.set(0, 0.25, 0);
      seatBack.castShadow = true;
      seatBack.receiveShadow = true;
      seatShell.add(seatBack);

      // Seat cushion
      const cushionGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.12, 32);
      const cushion = new THREE.Mesh(cushionGeo, darkFabricMaterial);
      cushion.position.y = 0.08;
      cushion.castShadow = true;
      cushion.receiveShadow = true;
      seatShell.add(cushion);

      // Round backrest cushion
      const headCushionGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 32);
      const headCushion = new THREE.Mesh(headCushionGeo, fabricMaterial);
      headCushion.rotation.z = Math.PI / 2;
      headCushion.position.set(0, 0.44, -0.22);
      headCushion.castShadow = true;
      seatShell.add(headCushion);

      pivotGroup.add(seatShell);

    } else if (type.includes('table') || type.includes('desk') || type.includes('طاولة') || type.includes('منضدة')) {
      // --- Premium Double Nesting Coffee Table ---
      // 1. Lower Table (Gold cylinder base with dark glass top)
      const baseLowGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.18, 48);
      const baseLow = new THREE.Mesh(baseLowGeo, goldMaterial);
      baseLow.position.set(-0.25, 0.09, 0.1);
      baseLow.castShadow = true;
      baseLow.receiveShadow = true;
      pivotGroup.add(baseLow);

      const glassTopGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.02, 48);
      const glassTop = new THREE.Mesh(glassTopGeo, glassMaterial);
      glassTop.position.set(-0.25, 0.19, 0.1);
      pivotGroup.add(glassTop);

      // 2. Higher Table (Wenge wood column base with clean travertine/marble top)
      const columnHighGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 32);
      const columnHigh = new THREE.Mesh(columnHighGeo, blackMetalMaterial);
      columnHigh.position.set(0.2, 0.15, -0.1);
      columnHigh.castShadow = true;
      columnHigh.receiveShadow = true;
      pivotGroup.add(columnHigh);

      const marbleTopGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 48);
      // Faux white marble with standard materials
      const marbleMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f2eb, // Travertine warm white
        roughness: 0.12,
        metalness: 0.05
      });
      const marbleTop = new THREE.Mesh(marbleTopGeo, marbleMaterial);
      marbleTop.position.set(0.2, 0.32, -0.1);
      marbleTop.castShadow = true;
      marbleTop.receiveShadow = true;
      pivotGroup.add(marbleTop);

      // Golden ring collar under the table top
      const collarGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.02, 32);
      const collar = new THREE.Mesh(collarGeo, goldMaterial);
      collar.position.set(0.2, 0.3, -0.1);
      collar.castShadow = true;
      pivotGroup.add(collar);

    } else if (type.includes('lamp') || type.includes('light') || type.includes('chandelier') || type.includes('إضاءة') || type.includes('نجفة') || type.includes('مصباح')) {
      // --- Premium Modern Luxury Chandelier ---
      // Ceiling plate
      const plateGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.015, 32);
      const plate = new THREE.Mesh(plateGeo, blackMetalMaterial);
      plate.position.y = 0.85;
      pivotGroup.add(plate);

      // Vertical suspension rod
      const rodGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.4, 16);
      const rod = new THREE.Mesh(rodGeo, blackMetalMaterial);
      rod.position.y = 0.65;
      pivotGroup.add(rod);

      // Horizontal light bar
      const barGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.9, 16);
      const bar = new THREE.Mesh(barGeo, goldMaterial);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 0.45;
      bar.castShadow = true;
      pivotGroup.add(bar);

      // Golden light cups and glowing light balls
      const cupGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 16);
      const bulbGeo = new THREE.SphereGeometry(0.05, 16, 16);
      
      const bulbOffsets = [-0.35, -0.12, 0.12, 0.35];

      bulbOffsets.forEach((offsetX) => {
        // Cup
        const cup = new THREE.Mesh(cupGeo, goldMaterial);
        cup.position.set(offsetX, 0.43, 0);
        pivotGroup.add(cup);

        // Glow bulb
        const bulb = new THREE.Mesh(bulbGeo, emissiveMaterial);
        bulb.position.set(offsetX, 0.39, 0);
        pivotGroup.add(bulb);
      });

      // Ceiling ring light circle (Luxury ambient halo design)
      const ringGeo = new THREE.TorusGeometry(0.25, 0.01, 16, 64);
      const ring = new THREE.Mesh(ringGeo, goldMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.52;
      ring.castShadow = true;
      pivotGroup.add(ring);

    } else {
      // --- General Luxury Decor Cube/Vase fallback ---
      // Elegant Travertine Pedestal with gold geometric frame
      const pedestalGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0xebdcb9,
        roughness: 0.4,
        metalness: 0.1
      });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.y = 0.25;
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      pivotGroup.add(pedestal);

      const frameGeo = new THREE.BoxGeometry(0.42, 0.02, 0.42);
      const goldFrame = new THREE.Mesh(frameGeo, goldMaterial);
      goldFrame.position.y = 0.51;
      pivotGroup.add(goldFrame);

      const crystalGeo = new THREE.DodecahedronGeometry(0.12, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0xb8935c,
        roughness: 0.1,
        metalness: 0.9
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(0, 0.62, 0);
      crystal.castShadow = true;
      pivotGroup.add(crystal);
    }

    this.modelGroup.add(pivotGroup);
    
    // Scale and position model group to sit perfectly in our view bounds
    const box = new THREE.Box3().setFromObject(pivotGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Center it horizontally and set base at y=0
    pivotGroup.position.x = -center.x;
    pivotGroup.position.y = -box.min.y;
    pivotGroup.position.z = -center.z;
    
    // Adjust group position slightly to make it visually centered
    this.modelGroup.position.y = 0.1;

    // Trigger loaded callback
    this.isLoading.set(false);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Apply auto rotation when idle
    const now = Date.now();
    if (now - this.lastInteractionTime > 3000) {
      this.modelGroup.rotation.y += this.autoRotateSpeed;
      this.currentRotation.y = this.modelGroup.rotation.y;
    }

    this.renderer.render(this.scene, this.camera);
  };

  private setupInteraction(): void {
    const canvas = this.canvasRef.nativeElement;

    // Mouse events
    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    // Touch events
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);

    // Zoom event
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private cleanupInteraction(): void {
    const canvas = this.canvasRef.nativeElement;

    canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);

    canvas.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);

    canvas.removeEventListener('wheel', this.onWheel);
  }

  private onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.lastInteractionTime = Date.now();
    this.previousMousePosition = {
      x: e.clientX,
      y: e.clientY
    };
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    this.lastInteractionTime = Date.now();
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;

    const rotationSpeed = 0.007;
    this.currentRotation.y += deltaX * rotationSpeed;
    this.currentRotation.x = Math.max(-0.4, Math.min(1.0, this.currentRotation.x + deltaY * rotationSpeed));

    this.modelGroup.rotation.y = this.currentRotation.y;
    this.modelGroup.rotation.x = this.currentRotation.x;

    this.previousMousePosition = {
      x: e.clientX,
      y: e.clientY
    };
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastInteractionTime = Date.now();
      this.previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (!this.isDragging || e.touches.length !== 1) return;
    
    // Prevent scrolling parent content while inspecting
    if (e.cancelable) {
      e.preventDefault();
    }

    this.lastInteractionTime = Date.now();
    const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
    const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

    const rotationSpeed = 0.009;
    this.currentRotation.y += deltaX * rotationSpeed;
    this.currentRotation.x = Math.max(-0.4, Math.min(1.0, this.currentRotation.x + deltaY * rotationSpeed));

    this.modelGroup.rotation.y = this.currentRotation.y;
    this.modelGroup.rotation.x = this.currentRotation.x;

    this.previousMousePosition = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  private onTouchEnd = (): void => {
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    // Zoom in/out by moving camera z-distance
    e.preventDefault();
    this.lastInteractionTime = Date.now();
    
    const zoomSpeed = 0.0015;
    let z = this.camera.position.z + e.deltaY * zoomSpeed;
    
    // Clamp zoom levels
    z = Math.max(1.3, Math.min(4.0, z));
    this.camera.position.z = z;
  };

  private setupResizeHandler(): void {
    const container = this.containerRef.nativeElement;
    
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];
        const width = entry.contentRect.width || container.clientWidth;
        const height = entry.contentRect.height || container.clientHeight;
        
        if (this.renderer && this.camera && width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }
      });
      this.resizeObserver.observe(container);
    }
  }

  private disposeObject(obj: any): void {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m: any) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    if (obj.children) {
      obj.children.forEach((child: any) => this.disposeObject(child));
    }
  }
}

import * as THREE from 'three';

/**
 * Pulmo Care — Minimalist, Clean 3D Respiratory Flow Stage
 * Non-hazy, lightweight, crisp medical-tech particle field and gentle breathing waveforms.
 */
export function createScene(canvas) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Minimal clean particles (breathing airflow simulation)
  const COUNT = isMobile ? 800 : 1800;
  const pos = new Float32Array(COUNT * 3);
  const basePos = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const radius = 2.5 + Math.random() * 4.5;
    const x = Math.cos(theta) * radius;
    const y = (Math.random() - 0.5) * 6;
    const z = Math.sin(theta) * radius * 0.4 - 1.0;

    pos[i3] = x;
    pos[i3 + 1] = y;
    pos[i3 + 2] = z;

    basePos[i3] = x;
    basePos[i3 + 1] = y;
    basePos[i3 + 2] = z;

    speeds[i] = 0.2 + Math.random() * 0.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  // Crisp, clean dot texture
  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = 64;
  dotCanvas.height = 64;
  const ctx = dotCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 1)');
  gradient.addColorStop(0.3, 'rgba(14, 165, 233, 0.6)');
  gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const dotTexture = new THREE.CanvasTexture(dotCanvas);

  const material = new THREE.PointsMaterial({
    size: isMobile ? 0.08 : 0.12,
    map: dotTexture,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.NormalBlending
  });

  const particleMesh = new THREE.Points(geometry, material);
  scene.add(particleMesh);

  // Subtle clean 3D respiratory torus / airflow ring
  const ringGeo = new THREE.TorusGeometry(3.2, 0.015, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.15
  });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 2.6;
  scene.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.0, 0.01, 16, 100), new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.12
  }));
  ring2.rotation.x = Math.PI / 2.2;
  ring2.rotation.y = 0.4;
  scene.add(ring2);

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function update(time, delta, scrollRatio) {
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    camera.position.x = mouse.x * 0.35;
    camera.position.y = mouse.y * 0.25 - (scrollRatio * 1.5);
    camera.lookAt(0, -scrollRatio * 1.5, 0);

    const positions = geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const spd = speeds[i];
      // Gentle breathing wave
      positions[i3 + 1] = basePos[i3 + 1] + Math.sin(time * 0.8 * spd + basePos[i3]) * 0.35;
      positions[i3] = basePos[i3] + Math.cos(time * 0.4 * spd + basePos[i3 + 1]) * 0.2;
    }
    geometry.attributes.position.needsUpdate = true;

    particleMesh.rotation.y = time * 0.03 + scrollRatio * 0.8;
    ring1.rotation.z = time * 0.04;
    ring2.rotation.z = -time * 0.03;

    renderer.render(scene, camera);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  return { update, intro: { v: 1 } };
}

/* =============================================================
   Three.js hero scene
   - Icosahedron wireframe with subtle displacement
   - Points particle field
   - Mouse parallax
   ============================================================= */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0A0B0F, 0.045);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  // ---------- Central geometry ----------
  const group = new THREE.Group();
  scene.add(group);

  const geometry = new THREE.IcosahedronGeometry(2.6, 3);
  const basePositions = geometry.attributes.position.array.slice();

  const wireframeMat = new THREE.MeshBasicMaterial({
    color: 0xFFB020,
    wireframe: true,
    transparent: true,
    opacity: 0.55
  });
  const solidMat = new THREE.MeshBasicMaterial({
    color: 0x0A0B0F,
    transparent: true,
    opacity: 0.6
  });

  const mesh = new THREE.Mesh(geometry, solidMat);
  const wireMesh = new THREE.Mesh(geometry, wireframeMat);
  group.add(mesh);
  group.add(wireMesh);

  // Outer ring
  const ringGeom = new THREE.TorusGeometry(4.2, 0.008, 8, 128);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xFFB020,
    transparent: true,
    opacity: 0.35
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2.6;
  group.add(ring);

  const ring2 = new THREE.Mesh(ringGeom, ringMat.clone());
  ring2.material.opacity = 0.2;
  ring2.rotation.x = Math.PI / 1.8;
  ring2.rotation.y = Math.PI / 3;
  ring2.scale.setScalar(1.15);
  group.add(ring2);

  // ---------- Particle field ----------
  const particleCount = 900;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSpeeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const r = 8 + Math.random() * 18;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    particlePositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = r * Math.cos(phi);
    particleSpeeds[i] = 0.0005 + Math.random() * 0.0015;
  }

  const particleGeom = new THREE.BufferGeometry();
  particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.028,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const particles = new THREE.Points(particleGeom, particleMat);
  scene.add(particles);

  // Accent particles (amber)
  const accentCount = 180;
  const accentPositions = new Float32Array(accentCount * 3);
  for (let i = 0; i < accentCount; i++) {
    const r = 4 + Math.random() * 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    accentPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    accentPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    accentPositions[i * 3 + 2] = r * Math.cos(phi);
  }
  const accentGeom = new THREE.BufferGeometry();
  accentGeom.setAttribute('position', new THREE.BufferAttribute(accentPositions, 3));
  const accentMat = new THREE.PointsMaterial({
    color: 0xFFB020,
    size: 0.05,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const accentParticles = new THREE.Points(accentGeom, accentMat);
  scene.add(accentParticles);

  // ---------- Sizing ----------
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // On narrower screens push the geometry a bit
    const zoom = w < 900 ? 12 : (w < 1200 ? 11 : 10);
    camera.position.z = zoom;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // ---------- Mouse parallax ----------
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const scroll = { y: 0 };

  window.addEventListener('mousemove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5);
    target.y = (e.clientY / window.innerHeight - 0.5);
  });
  window.addEventListener('scroll', () => {
    scroll.y = window.scrollY;
  }, { passive: true });

  // ---------- Animate ----------
  const clock = new THREE.Clock();
  const posAttr = geometry.attributes.position;

  function animate() {
    const t = clock.getElapsedTime();

    // ease mouse target
    current.x += (target.x - current.x) * 0.05;
    current.y += (target.y - current.y) * 0.05;

    // rotate group with parallax
    group.rotation.y = t * 0.15 + current.x * 0.6;
    group.rotation.x = t * 0.08 + current.y * 0.4;

    // subtle scroll-based shrink
    const scrollNorm = Math.min(1, scroll.y / window.innerHeight);
    group.scale.setScalar(1 - scrollNorm * 0.25);
    group.position.y = scrollNorm * -1.5;

    // vertex displacement — breathing wireframe
    if (!reduce) {
      for (let i = 0; i < posAttr.count; i++) {
        const ox = basePositions[i * 3];
        const oy = basePositions[i * 3 + 1];
        const oz = basePositions[i * 3 + 2];
        const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
        const nx = ox / len, ny = oy / len, nz = oz / len;
        const wave = Math.sin(t * 1.2 + ox * 2 + oy * 1.5) * 0.08
                   + Math.cos(t * 0.9 + oz * 1.8) * 0.05;
        const s = 1 + wave;
        posAttr.array[i * 3]     = nx * len * s;
        posAttr.array[i * 3 + 1] = ny * len * s;
        posAttr.array[i * 3 + 2] = nz * len * s;
      }
      posAttr.needsUpdate = true;
    }

    // particle slow rotation
    particles.rotation.y = t * 0.02;
    particles.rotation.x = t * 0.01;
    accentParticles.rotation.y = -t * 0.05;
    accentParticles.rotation.z = t * 0.03;

    // ring counter-rotate
    ring.rotation.z = t * 0.25;
    ring2.rotation.z = -t * 0.18;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Theme response — swap accent color when theme changes
  const observer = new MutationObserver(() => {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const accent = light ? 0xB8760F : 0xFFB020;
    wireframeMat.color.setHex(accent);
    ringMat.color.setHex(accent);
    ring2.material.color.setHex(accent);
    accentMat.color.setHex(accent);
    solidMat.color.setHex(light ? 0xF4F3EE : 0x0A0B0F);
    scene.fog.color.setHex(light ? 0xF4F3EE : 0x0A0B0F);
    particleMat.color.setHex(light ? 0x333333 : 0xFFFFFF);
    particleMat.opacity = light ? 0.35 : 0.55;
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

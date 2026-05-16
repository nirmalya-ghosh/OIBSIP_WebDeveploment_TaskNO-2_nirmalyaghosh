/**
 * Three.js Particle Network Background
 * A high-performance, aesthetically premium particle system.
 */

const initParticles = () => {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // SCENE SETUP
    const scene = new THREE.Scene();

    // CAMERA
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    container.innerHTML = ''; // Clear existing
    container.appendChild(renderer.domElement);

    // PARTICLES CONFIG
    const particleCount = window.innerWidth < 900 ? 32 : 88;
    const connectionDistance = window.innerWidth < 900 ? 86 : 118;
    const particles = [];
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    // TEXTURE LOADER (Generated Circle)
    const createCircleTexture = () => {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size / 2;

        ctx.beginPath();
        ctx.arc(center, center, center / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; // White, colorized by material
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    };

    // MATERIAL
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x20f7b4,
        size: window.innerWidth < 900 ? 2.8 : 3.6,
        map: createCircleTexture(),
        alphaTest: 0.5, // Discard transparent pixels
        transparent: true,
        opacity: 0.72
    });

    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.14
    });

    // CREATE PARTICLES
    for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 400; // Spread x
        const y = (Math.random() - 0.5) * 300; // Spread y
        const z = (Math.random() - 0.5) * 200; // Depth

        particles.push({
            x: x,
            y: y,
            z: z,
            vx: (Math.random() - 0.5) * 0.075,
            vy: (Math.random() - 0.5) * 0.075,
            vz: (Math.random() - 0.5) * 0.035
        });

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlesMesh);

    // LINES MESH (Segments)
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(particleCount * particleCount * 3); // Large enough buffer
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // MOUSE INTERACTION
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    }, { passive: true });

    // ANIMATION LOOP
    const animate = () => {
        requestAnimationFrame(animate);

        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        // Rotate scene slightly based on mouse
        scene.rotation.y += 0.00025 + (targetX - scene.rotation.y) * 0.035;
        scene.rotation.x += 0.00025 + (targetY - scene.rotation.x) * 0.035;

        // Update Particles
        const positions = particlesMesh.geometry.attributes.position.array;
        let lineVertexIndex = 0;
        const linePosAttrib = linesMesh.geometry.attributes.position;

        for (let i = 0; i < particleCount; i++) {
            const p = particles[i];

            // Move
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            // Bounce off boundaries (soft limits)
            if (p.x < -250 || p.x > 250) p.vx = -p.vx;
            if (p.y < -200 || p.y > 200) p.vy = -p.vy;
            if (p.z < -100 || p.z > 100) p.vz = -p.vz;

            // Update buffer
            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;

            // Check Connections
            for (let j = i + 1; j < particleCount; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dz = p.z - p2.z;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < connectionDistance * connectionDistance) {
                    const lPos = linePosAttrib.array;
                    lPos[lineVertexIndex++] = p.x;
                    lPos[lineVertexIndex++] = p.y;
                    lPos[lineVertexIndex++] = p.z;

                    lPos[lineVertexIndex++] = p2.x;
                    lPos[lineVertexIndex++] = p2.y;
                    lPos[lineVertexIndex++] = p2.z;
                }
            }

            // MOUSE INTERACTION: Connect to mouse
            const mouseVec = new THREE.Vector3(
                (mouseX / windowHalfX) * 120,
                -(mouseY / windowHalfY) * 100,
                0
            );

            const dxM = p.x - mouseVec.x;
            const dyM = p.y - mouseVec.y;
            const distMouseSq = dxM * dxM + dyM * dyM;
            const mouseConnectDist = 150;

            if (distMouseSq < mouseConnectDist * mouseConnectDist) {
                const lPos = linePosAttrib.array;
                if (lineVertexIndex < linePositions.length - 6) {
                    lPos[lineVertexIndex++] = p.x;
                    lPos[lineVertexIndex++] = p.y;
                    lPos[lineVertexIndex++] = p.z;

                    lPos[lineVertexIndex++] = mouseVec.x;
                    lPos[lineVertexIndex++] = mouseVec.y;
                    lPos[lineVertexIndex++] = p.z;
                }
            }
        }

        particlesMesh.geometry.attributes.position.needsUpdate = true;

        // Update Line Draw Range to only render used segments
        linesMesh.geometry.setDrawRange(0, lineVertexIndex / 3);
        linesMesh.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    };

    animate();

    // RESIZE HANDLER
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// Auto-init if DOM ready, else wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticles);
} else {
    initParticles();
}

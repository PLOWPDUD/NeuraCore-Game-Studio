/**
 * Defines standard game templates that the AI can use as a starting point.
 */
export const DEFAULT_3D_GAME = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nexus 3D Game</title>
  <style>
    body { margin: 0; overflow: hidden; background-color: #000; }
    #info { position: absolute; top: 10px; width: 100%; text-align: center; color: white; user-select: none; font-family: sans-serif; pointer-events: none; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
</head>
<body>
  <div id="info">Use WASD or Arrows to move</div>
  <script>
    // Physics World Setup
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // m/s²
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // Three.js Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0b0c0); // Sky color
    scene.fog = new THREE.FogExp2(0xa0b0c0, 0.03); // Volumetric fog
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    document.body.appendChild(renderer.domElement);

    // Light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Soft ambient
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xfffae0, 1.5); // Warm sun
    dirLight.position.set(10, 20, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Ground Physics & Graphics
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Forest green
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Player Physics & Graphics
    const playerShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const playerBody = new CANNON.Body({ mass: 5, shape: playerShape });
    playerBody.position.set(0, 5, 0);
    playerBody.linearDamping = 0.9;
    world.addBody(playerBody);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const player = new THREE.Mesh(geometry, material);
    player.castShadow = true;
    scene.add(player);

    camera.position.set(0, 5, 10);
    camera.lookAt(player.position);

    // Movement
    const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };
    document.addEventListener('keydown', (e) => {
      keys[e.key] = true;
      if (e.key === ' ') {
        // Jump if near ground
        if (playerBody.position.y < 1) {
           playerBody.velocity.y = 5;
        }
      }
    });
    document.addEventListener('keyup', (e) => keys[e.key] = false);

    const force = 20;

    const timeStep = 1 / 60;
    function animate() {
      requestAnimationFrame(animate);

      // Apply forces for movement
      if (keys.w || keys.ArrowUp) playerBody.applyLocalForce(new CANNON.Vec3(0, 0, -force), new CANNON.Vec3(0,0,0));
      if (keys.s || keys.ArrowDown) playerBody.applyLocalForce(new CANNON.Vec3(0, 0, force), new CANNON.Vec3(0,0,0));
      if (keys.a || keys.ArrowLeft) playerBody.applyLocalForce(new CANNON.Vec3(-force, 0, 0), new CANNON.Vec3(0,0,0));
      if (keys.d || keys.ArrowRight) playerBody.applyLocalForce(new CANNON.Vec3(force, 0, 0), new CANNON.Vec3(0,0,0));

      // Step physics
      world.step(timeStep);

      // Sync Graphics to Physics
      player.position.copy(playerBody.position);
      player.quaternion.copy(playerBody.quaternion);

      // Camera follow
      camera.position.x = player.position.x;
      camera.position.y = player.position.y + 5;
      camera.position.z = player.position.z + 10;
      camera.lookAt(player.position);

      renderer.render(scene, camera);
    }
    
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
  </script>
</body>
</html>`;

export const DEFAULT_2D_GAME = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nexus 2D Physics Game</title>
  <style>
    body { margin: 0; overflow: hidden; background-color: #222; }
    #info { position: absolute; top: 10px; width: 100%; text-align: center; color: white; user-select: none; font-family: monospace; pointer-events: none; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
</head>
<body>
  <div id="info">Use WASD or Arrows to move. Click to spawn boxes!</div>
  <script>
    // Matter.js alias
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Body = Matter.Body,
          Events = Matter.Events;

    // Create engine
    const engine = Engine.create();

    // Create renderer
    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: '#111'
        }
    });

    // Create player and ground
    const player = Bodies.rectangle(window.innerWidth / 2, 100, 40, 40, { 
      render: { fillStyle: '#00ffcc' },
      frictionAir: 0.05
    });
    
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, 60, { 
      isStatic: true, 
      render: { fillStyle: '#444' } 
    });

    Composite.add(engine.world, [player, ground]);

    // Render and run
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Input handling
    const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);

    Events.on(engine, 'beforeUpdate', () => {
        const force = 0.002;
        if (keys.w || keys.ArrowUp) {
            // Only jump if resting (simple check by velocity)
            if (Math.abs(player.velocity.y) < 0.1) Body.applyForce(player, player.position, { x: 0, y: -0.05 });
        }
        if (keys.a || keys.ArrowLeft) Body.applyForce(player, player.position, { x: -force, y: 0 });
        if (keys.d || keys.ArrowRight) Body.applyForce(player, player.position, { x: force, y: 0 });
    });

    // Spawn boxes on click
    document.addEventListener('mousedown', (e) => {
        const box = Bodies.rectangle(e.clientX, e.clientY, 30, 30, {
            render: { fillStyle: Math.random() > 0.5 ? '#ff0055' : '#ffcc00' }
        });
        Composite.add(engine.world, box);
    });

    // Resize handling
    window.addEventListener('resize', () => {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        render.options.width = window.innerWidth;
        render.options.height = window.innerHeight;
        Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight });
    });
  </script>
</body>
</html>`;

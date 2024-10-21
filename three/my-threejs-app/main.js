import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls.js'



// Loading Manager to track progress
const loadingManager = new THREE.LoadingManager(
    () => {
        // Hide loading screen when loading is complete
        document.getElementById('loading-screen').style.display = 'none';
    },
    (itemUrl, itemsLoaded, itemsTotal) => {
        // Update the progress bar
        const progress = (itemsLoaded / itemsTotal) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    }
);

let sun, moon, sunMesh, moonMesh,  sky, clouds, stars, terrainGeometry;
let daySkyMaterial, nightSkyMaterial;



// Set up the scene, camera, and renderer

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight , 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
document.body.appendChild(renderer.domElement);
let zombieSpeed = 0.05; // Speed at which the zombie runs
let minimumDistance = 1.5; // Distance at which the zombie stops running and can punch
const width=800;
const length = 800;
const zombies = [];
const loader = new FBXLoader(loadingManager); 


addSun()
addMoon()
addSky();
addClouds();
addStars();
createTerrain();   
       
        
const createZombie = (skin, position) => {
    loader.load(skin, (fbx) => {
        fbx.scale.setScalar(0.09);
        fbx.position.copy(position);
        fbx.name = 'Zombie';
        scene.add(fbx);

        const mixer = new THREE.AnimationMixer(fbx);
        const zombieData = { fbx, mixer, actionChosen: false, chosenAction: null, isDead: false, life: 10 }; // Set life to 5

        // Load animations
        loader.load('/Running.fbx', (fb) => {
            zombieData.runAction = mixer.clipAction(fb.animations[0]);
            zombieData.runAction.play();
        });
        loader.load('/Zombie_Punching.fbx', (fb) => {
            zombieData.punchAction = mixer.clipAction(fb.animations[0]);
        });
        loader.load('/zombie_biting.fbx', (fb) => {
            zombieData.biteAction = mixer.clipAction(fb.animations[0]);
        });
        loader.load('/zombie_biting_neck.fbx', (fb) => {
            zombieData.biteNeckAction = mixer.clipAction(fb.animations[0]);
        });
        loader.load('/Zombie_Dying.fbx', (fb) => {
            zombieData.Dying1 = mixer.clipAction(fb.animations[0]);
            zombieData.Dying1.loop = THREE.LoopOnce; // Set loop mode to LoopOnce
            zombieData.Dying1.clampWhenFinished = true; // Ensure the animation doesn't reset
            console.log('Dying animation loaded:', zombieData.Dying1);
        });
        loader.load('/Zombie_Death.fbx', (fb) => {
            zombieData.Dying2 = mixer.clipAction(fb.animations[0]);
            zombieData.Dying2.loop = THREE.LoopOnce; // Set loop mode to LoopOnce
            zombieData.Dying2.clampWhenFinished = true; // Ensure the animation doesn't reset
        });
        zombies.push(zombieData);

        fbx.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    });
};

           

function createWall(terrainGeometry) {
    const textureLoader = new THREE.TextureLoader();

    // Load wall bump map
    const wallBumpMap = textureLoader.load('wallbumpmap.jpg');

    // Configure the bump map so it doesn't tile too many times
      // Configure the bump map to repeat
      wallBumpMap.wrapS = wallBumpMap.wrapT = THREE.RepeatWrapping;
    wallBumpMap.repeat.set(1, 1); // Adjust this value to maintain the original aspect ratio


    // Helper function to get terrain height at specific coordinates
    function getTerrainHeight(x, z, terrainGeometry, terrainWidth, terrainLength, resolution) {
        const vertices = terrainGeometry.attributes.position.array;

        // Convert x, z into the corresponding index on the heightmap grid
        const xIndex = Math.floor((x + terrainWidth / 2) / terrainWidth * (resolution - 1));
        const zIndex = Math.floor((z + terrainLength / 2) / terrainLength * (resolution - 1));

        // Find the corresponding vertex in the geometry
        const vertexIndex = (zIndex * resolution + xIndex) * 3; // Each vertex has 3 components (x, y, z)
        const terrainHeight = vertices[vertexIndex + 2]; // The height is the Z component in the plane geometry

        return terrainHeight;
    }

    // Define the geometry and material for the walls
    const wallGeometry = new THREE.BoxGeometry(width, 30, 1);

    // Use MeshPhongMaterial to support bump mapping
    const wallMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,  // A brown color for the walls
        bumpMap: wallBumpMap,
        bumpScale: 0.5,   // Adjust this value to control the intensity of the bump effect
        shininess: 10     // Adjust for desired shininess
    });

    // Create front wall
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    const frontWallHeight = getTerrainHeight(0, -width / 2, terrainGeometry, width, length, 128); // Adjust based on resolution
    frontWall.position.set(0, frontWallHeight + 10, -width / 2);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    // Create back wall
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    const backWallHeight = getTerrainHeight(0, width / 2, terrainGeometry, width, length, 128);
    backWall.position.set(0, backWallHeight + 10, width / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Create left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    const leftWallHeight = getTerrainHeight(-width / 2, 0, terrainGeometry, width, length, 128);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-width / 2, leftWallHeight + 10, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Create right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    const rightWallHeight = getTerrainHeight(width / 2, 0, terrainGeometry, width, length, 128);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(width / 2, rightWallHeight + 10, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
}

function createTerrain() {
    const terrainWidth = width;
    const terrainLength = length;
    const resolution = 128; // This should match your heightmap image resolution

    // Load the heightmap and ground texture
    const loader = new THREE.TextureLoader();
    
    // Load the heightmap
    loader.load('terrain.jfif', (heightmapTexture) => {
        // Load the ground texture
        loader.load('ground.jpg', (groundTexture) => {
            // Repeat the texture over the terrain
            groundTexture.wrapS = groundTexture.wrapT = THREE.ClampToEdgeWrapping;
            
            // Ensure the texture covers the entire plane by adjusting UV coordinates (not tiling)
            groundTexture.repeat.set(1, 1);

            // Create a canvas to read heightmap pixel data
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = resolution;
            canvas.height = resolution;
            context.drawImage(heightmapTexture.image, 0, 0);
            const imageData = context.getImageData(0, 0, resolution, resolution);

            // Create the geometry
            terrainGeometry = new THREE.PlaneGeometry(
                terrainWidth,
                terrainLength,
                resolution - 1,
                resolution - 1
            );

            // Deform the geometry based on the heightmap
            const vertices = terrainGeometry.attributes.position.array;
            for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
                const heightValue = imageData.data[i * 4]; // Assuming grayscale image, use only the red channel
                vertices[j + 2] = heightValue / 20; // Adjust the division factor to control the terrain height
            }

            // Update normals to account for the new vertex positions
            terrainGeometry.computeVertexNormals();

            // Create the material for the terrain using the ground texture
            const terrainMaterial = new THREE.MeshLambertMaterial({
                map: groundTexture,  // Apply the ground texture
                wireframe: false     // Set to true if you want to see the mesh structure
            });

            // Create the terrain mesh
            const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
            terrain.rotation.x = -Math.PI / 2; // Rotate to lay flat
            terrain.receiveShadow = true;      // Allow the terrain to receive shadows

            // Add the terrain to the scene
            scene.add(terrain);

            // Optionally, create walls around the terrain
            createWall(terrainGeometry);
            addStructures();
        });
    });
}

function getTerrainHeight(x, z, terrainGeometry, terrainWidth, terrainLength, resolution) {
        const vertices = terrainGeometry.attributes.position.array;

        // Convert x, z into the corresponding index on the heightmap grid
        const xIndex = Math.floor((x + terrainWidth / 2) / terrainWidth * (resolution - 1));
        const zIndex = Math.floor((z + terrainLength / 2) / terrainLength * (resolution - 1));

        // Find the corresponding vertex in the geometry
        const vertexIndex = (zIndex * resolution + xIndex) * 3; // Each vertex has 3 components (x, y, z)
        const terrainHeight = vertices[vertexIndex + 2]; // The height is the Z component in the plane geometry

        return terrainHeight;
 }


    function addSun() {
        sun = new THREE.DirectionalLight(0xe6f0c5, 1);
        sun.position.set(0, 1000, 0); // Move sun high up
        sun.castShadow = true;

        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 1500;
        sun.shadow.camera.left = -500;
        sun.shadow.camera.right = 500;
        sun.shadow.camera.top = 500;
        sun.shadow.camera.bottom = -500;

        scene.add(sun);

        // Create a sky sphere
        const skyGeometry = new THREE.SphereGeometry(900, 32, 32);
        daySkyMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
        const sky = new THREE.Mesh(skyGeometry, daySkyMaterial);
        scene.add(sky);

        // Create sun sphere (visual representation)
        const sunGeometry = new THREE.SphereGeometry(40, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        sunMesh.position.set(0, 1000, 0); // Position sun in the sky sphere
        sky.add(sunMesh); // Add sun to the sky
    }

    function animateSun() {
            const time = Date.now() * 0.001;
            const radius = 700;
            sunMesh.position.x = Math.cos(time * 0.1) * radius;
            sunMesh.position.y = Math.sin(time * 0.1) * radius;

            // Update directional light position
            sun.position.copy(sunMesh.position);
            sun.position.multiplyScalar(1000 / radius);

          
        }

    function addMoon() {
        moon = new THREE.DirectionalLight(0xffffff, 0.5); // Dimmer than the sun
        moon.position.set(0, 1000, 0); // Position it high up, same as the sun
        moon.castShadow = true; // Moonlight usually does not cast shadows

        moon.shadow.mapSize.width = 2048;
        moon.shadow.mapSize.height = 2048;
        moon.shadow.camera.near = 0.5;
        moon.shadow.camera.far = 1500;
        moon.shadow.camera.left = -500;
        moon.shadow.camera.right = 500;
        moon.shadow.camera.top = 500;
        moon.shadow.camera.bottom = -500;
        moon.shadow.bias = -0.0155; 

        scene.add(moon);

        // Create a sky sphere
        const skyGeometry = new THREE.SphereGeometry(900, 32, 32);
       nightSkyMaterial = new THREE.MeshBasicMaterial({ color: 0x391f8f, side: THREE.BackSide });
        const sky = new THREE.Mesh(skyGeometry, nightSkyMaterial);
        scene.add(sky);

        const textureLoader = new THREE.TextureLoader();
    textureLoader.load('moon.jpg', function(texture) {
        // Create moon sphere (visual representation) with the texture
        const moonGeometry = new THREE.SphereGeometry(40, 32, 32);
        const moonMaterial = new THREE.MeshBasicMaterial({ map: texture }); // Use moon texture

        moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        moonMesh.position.set(0, 1000, 0); // Position moon in the sky sphere
        scene.add(moonMesh); // Add moon to the scene
    });
        
    }

    function animateMoon() {
        const time = Date.now() * 0.001;
        const radius = 700;
        moonMesh.position.x = Math.cos(time * 0.1 + Math.PI) * radius; // Moon follows opposite direction of sun
        moonMesh.position.y = Math.sin(time * 0.1 + Math.PI) * radius;

        // Update moon directional light position
        moon.position.copy(moonMesh.position);
        moon.position.multiplyScalar(1000 / radius);

        // Update sky color
        
    }

    function addSky() {
      const skyGeometry = new THREE.SphereGeometry(900, 32, 32);
      const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
      sky = new THREE.Mesh(skyGeometry, skyMaterial);
      scene.add(sky);
    }

    function addClouds() {
      clouds = new THREE.Group();
      const cloudGeometry = new THREE.SphereGeometry(5, 8, 8);
      const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 });

      for (let i = 0; i < 100; i++) {
        const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloudPart.position.set(
          Math.random() * 800 - 400,
          Math.random() * 100 + 200,
          Math.random() * 800 - 400
        );
        cloudPart.scale.set(Math.random() * 2 + 1, Math.random() * 2 + 1, Math.random() * 2 + 1);
        clouds.add(cloudPart);
      }
      scene.add(clouds);
    }

    function addStars() {
      stars = new THREE.Group();
      const starGeometry = new THREE.SphereGeometry(0.7, 8, 8);
      const starMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

      for (let i = 0; i < 1000; i++) {
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(
          Math.random() * 1800 - 300,
          Math.random() * 1800 - 300,
          Math.random() * 1800 - 300
        );
        stars.add(star);
      }
      scene.add(stars);
    }

    function updateSkyColor() {
      const dayColor = new THREE.Color(0x87CEEB); // Blue sky
      const nightColor = new THREE.Color(0x192841); // Dark night sky
      const sunsetColor = new THREE.Color(0xFFA500); // Orange for sunset

      let t = (sunMesh.position.y + 700) / 1400; // Normalize sun position to [0, 1]
      t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]

      let skyColor;
      if (t > 0.7) {
        skyColor = dayColor;
        clouds.visible = true;
        stars.visible = false;
      } else if (t > 0.4) {
        skyColor = dayColor.lerp(sunsetColor, (t - 0.4) * (1 / 0.3));
        clouds.visible = true;
        stars.visible = false;
      } else if (t > 0.2) {
        skyColor = sunsetColor.lerp(nightColor, (t - 0.2) * (1 / 0.2));
        clouds.visible = false;
        stars.visible = true;
      } else {
        skyColor = nightColor;
        clouds.visible = false;
        stars.visible = true;
      }

      sky.material.color.copy(skyColor);

      // Adjust cloud opacity based on time of day
      if (clouds.visible) {
        const cloudOpacity = Math.min(1, Math.max(0, (t - 0.4) * 2));
        clouds.children.forEach(cloud => {
          cloud.material.opacity = cloudOpacity * 0.8;
        });
      }

      // Adjust star brightness based on time of day
      if (stars.visible) {
        const starBrightness = Math.min(1, Math.max(0, (0.4 - t) * 2));
        stars.children.forEach(star => {
          star.material.opacity = starBrightness;
        });
      }
    }

    const obstacles = [];

    function createTower(x, z) {
    const baseHeight = 50;
    
    // Create the base of the lighthouse (cylinder shape)
    const baseGeometry = new THREE.CylinderGeometry(10, 14, baseHeight, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x964B00 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, baseHeight / 2, z);
    base.castShadow = true; // Enable casting shadows
    base.receiveShadow = true; // Enable receiving shadows
    scene.add(base);

    // Create the top of the lighthouse (light housing)
    const topHeight = 5;
    const topGeometry = new THREE.CylinderGeometry(5, 5, topHeight, 16);
    const topMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(x, baseHeight + topHeight / 2, z);
    top.castShadow = true;
    top.receiveShadow = true;
    scene.add(top);

    // Add a dome on top of the light housing
    const domeGeometry = new THREE.SphereGeometry(4, 16, 16, 0, Math.PI);
    const domeMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(x, baseHeight + topHeight + 2.5, z); // Positioned at the top of the housing
    dome.castShadow = true;
    dome.receiveShadow = true;
    scene.add(dome);

    // Create the light source at the top of the lighthouse
    const lighthouseLight = new THREE.PointLight(0xffffff,  1, 500); // White light, intensity 1, range 500
    lighthouseLight.position.set(x, baseHeight + topHeight + 5, z);
    lighthouseLight.castShadow = true;
    scene.add(lighthouseLight);

    // Optionally, add a small bulb or light representation
    const bulbGeometry = new THREE.SphereGeometry(1, 16, 16);
    const bulbMaterial = new THREE.MeshBasicMaterial({
        color:  0xFFFF00, // Dim during the day, glowing yellow at night
        emissive:0xFFFF00, // No glow during day, neon glow at night
        emissiveIntensity:  1, // Intense glow at night
        toneMapped: false, // Keeps glow intensity even under HDR
    });

    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.set(x, baseHeight + topHeight + 5, z);
    scene.add(bulb);

    // Add bounding boxes for the lighthouse
    const towerBoundingBox = new THREE.Box3().setFromObject(base);
    obstacles.push({ mesh: base, boundingBox: towerBoundingBox });
}
function addTrees() {
    const treeCount = width*0.25; // Number of trees
    const textureLoader = new THREE.TextureLoader();
    
    // Load the bump map texture
    const barkBumpMap = textureLoader.load('treebark.jpg'); // Replace with the path to your texture
    const leafTexture = textureLoader.load('leaves.avif'); // Replace with the path to your leaf texture


    for (let i = 0; i < treeCount; i++) {
        const x = Math.random() * width - width / 2; // Randomize x position
        const z = Math.random() * width - width / 2; // Randomize z position

        // Randomize tree sizes
        const trunkHeight = 25 + Math.random() * 20;
        const trunkRadius = 2.5 + Math.random() * 3.5;

        // Create the tree trunk with bump map
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight);
        const trunkMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513,
            bumpMap: barkBumpMap,
            

            bumpScale: 0.7
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, trunkHeight / 2, z);
        
        trunk.castShadow = true;
        trunk.receiveShadow = true;

        // Create low-poly tree leaves
        const leavesGroup = new THREE.Group();
        const leavesMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x228B22,
            flatShading: true, // This gives the polygon look
            map: leafTexture,
        });

        // Create multiple geometric shapes for leaves
        for (let j = 0; j < 5; j++) { // Adjust number of leaf clusters
            const leafGeometry = new THREE.IcosahedronGeometry(10 + Math.random() * 5, 0); // Low poly sphere
            const leaf = new THREE.Mesh(leafGeometry, leavesMaterial);
            
            // Position leaves
            const angle = (j / 5) * Math.PI * 2;
            const radius = 5 + Math.random() * 3;
            leaf.position.set(
                Math.cos(angle) * radius,
                trunkHeight + 5 + Math.random() * 5,
                Math.sin(angle) * radius
            );
            
            // Random scaling and rotation
            const scale = 0.8 + Math.random() * 0.4;
            leaf.scale.set(scale, scale * 1.2, scale);
            leaf.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.5);
            
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            
            leavesGroup.add(leaf);
        }

        // Add color variation
        leavesGroup.children.forEach(leaf => {
            leaf.material = leaf.material.clone();
            leaf.material.color.setHSL(
                0.25 + Math.random() * 0.1,
                0.5 + Math.random() * 0.2,
                0.4 + Math.random() * 0.2
            );
        });

        leavesGroup.position.set(x, 0, z);
        scene.add(leavesGroup);
        scene.add(trunk);

        // Create a bounding box for the entire tree
        const treeBoundingBox = new THREE.Box3().setFromObject(trunk);
        //treeBoundingBox.expandByObject(trunk);

        // Add tree as an obstacle (bounding box)
        obstacles.push({ mesh: trunk, boundingBox: treeBoundingBox });
    }
}

addTrees();

function addStructures() {
    const structureCount = width * 0.01;
    const textureLoader = new THREE.TextureLoader();
    // Load texture maps
    const baseColorMap = textureLoader.load('Wall_Stone_010_basecolor.jpg');
    const normalMap = textureLoader.load('Wall_Stone_010_normal.jpg');
    const roughnessMap = textureLoader.load('Wall_Stone_010_roughness.jpg');
    const heightMap = textureLoader.load('Wall_Stone_010_height.png');  // Also known as displacement map
    const aoMap = textureLoader.load('Wall_Stone_010_ambientOcclusion.jpg');

    const brickMaterial = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: baseColorMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        displacementMap: heightMap,
        displacementScale: 0.8,
        aoMap: aoMap,
        roughness: 0.8,
        metalness: 0.8
    });

        // Ensure that openingHeight and openingWidth are defined
        const openingHeight = 25; // Example value, adjust as needed
    const openingWidth = 15;  // Example value, adjust as needed

    function isSpaceClear(x, z, structureWidth, depth) {
        const margin = 5; // Add a small margin around structures
        const checkBox = new THREE.Box3(
            new THREE.Vector3(x - structureWidth / 2 - margin, 0, z - depth / 2 - margin),
            new THREE.Vector3(x + structureWidth / 2 + margin, 100, z + depth / 2 + margin)
        );

        // Check against existing obstacles
        for (let obstacle of obstacles) {
            if (checkBox.intersectsBox(obstacle.boundingBox)) {
                return false;
            }
        }

        return true;
    }

    let placedStructures = 0;
    let attempts = 0;
    const maxAttempts = structureCount * 10;

    // Try placing structures until the desired count or max attempts is reached
    while (placedStructures < structureCount && attempts < maxAttempts) {
        attempts++;
        const x = Math.random() * width - width / 2;
        const z = Math.random() * width - width / 2;

        const structureWidth = 25 + Math.random() * 15;
        const depth = 20 + Math.random() * 15;
        const height = 35 + Math.random() * 15;
        const terrainHeight = getTerrainHeight(x, z, terrainGeometry, width, length, 128);

        if (!isSpaceClear(x, z, structureWidth, depth)) {
            continue;  // Skip this iteration if the space is not clear
        }

        // Create a group to hold all parts of the structure
        const structureGroup = new THREE.Group();

        // Create walls with more segments for better displacement
        const wallGeometry = new THREE.BoxGeometry(1, height, depth, 1, 50, 50);

        // Left wall
        const leftWall = new THREE.Mesh(wallGeometry, brickMaterial);
        leftWall.position.set(-structureWidth / 2 + 0.5, height / 2, 0);
        structureGroup.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(wallGeometry, brickMaterial);
        rightWall.position.set(structureWidth / 2 - 0.5, height / 2, 0);
        structureGroup.add(rightWall);

        // Back wall
        const backWallGeometry = new THREE.BoxGeometry(structureWidth, height, 1, 50, 50, 1);
        const backWall = new THREE.Mesh(backWallGeometry, brickMaterial);
        backWall.position.set(0, height / 2, -depth / 2 + 0.5);
        structureGroup.add(backWall);

         // Front wall (with opening)
         const frontWallTopGeometry = new THREE.BoxGeometry(structureWidth, height - openingHeight, 1, 50, 25, 1);
        const frontWallTop = new THREE.Mesh(frontWallTopGeometry, brickMaterial);
        frontWallTop.position.set(0, height/2 + openingHeight/2, depth/2 - 0.5);
        structureGroup.add(frontWallTop);
        
      

        const frontWallSideGeometry = new THREE.BoxGeometry((structureWidth - openingWidth)/2, openingHeight, 1, 25, 25, 1);
        const frontWallLeft = new THREE.Mesh(frontWallSideGeometry, brickMaterial);
        frontWallLeft.position.set(-structureWidth/4 - openingWidth/4, openingHeight/2, depth/2 - 0.5);
        structureGroup.add(frontWallLeft);

        const frontWallRight = new THREE.Mesh(frontWallSideGeometry, brickMaterial);
        frontWallRight.position.set(structureWidth/4 + openingWidth/4, openingHeight/2, depth/2 - 0.5);
        structureGroup.add(frontWallRight);

        

        // Roof
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.2 });
        const roofGeometry = new THREE.BoxGeometry(structureWidth, 1, depth);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height - 0.5, 0);
        structureGroup.add(roof);

        // Position the entire structure
        structureGroup.position.set(x, terrainHeight - 1, z);

        // Add shadows
        structureGroup.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });

        scene.add(structureGroup);

        // Create bounding boxes for each wall to use as obstacles
        const wallThickness = 3;
        const localobstacles = [
            new THREE.Box3().setFromObject(new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth))),
            new THREE.Box3().setFromObject(new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth))),
            new THREE.Box3().setFromObject(new THREE.Mesh(new THREE.BoxGeometry(structureWidth, height, wallThickness))),
                // Front wall top
                new THREE.Box3().setFromObject(new THREE.Mesh(new THREE.BoxGeometry(structureWidth, height - openingHeight, wallThickness))),
            // Front wall left
            new THREE.Box3().setFromObject(new THREE.Mesh(new THREE.BoxGeometry((structureWidth - openingWidth)/2, openingHeight, wallThickness))),
            // Front wall right
            new THREE.Box3().setFromObject(new THREE.Mesh(new THREE.BoxGeometry((structureWidth - openingWidth)/2, openingHeight, wallThickness))),
            new THREE.Box3().setFromObject(new THREE.Mesh(new THREE.BoxGeometry(structureWidth, height - 10, wallThickness)))
        ];

        localobstacles[0].translate(new THREE.Vector3(x - structureWidth / 2 + wallThickness / 2, height / 2, z));
        localobstacles[1].translate(new THREE.Vector3(x + structureWidth / 2 - wallThickness / 2, height / 2, z));
        localobstacles[2].translate(new THREE.Vector3(x, height / 2, z - depth / 2 + wallThickness / 2));
        localobstacles[3].translate(new THREE.Vector3(x, height / 2 + 10 / 2, z + depth / 2 - wallThickness / 2));

        localobstacles.forEach(box => {
            obstacles.push({ boundingBox: box });
        });

        placedStructures++;
    }

    if (attempts >= maxAttempts) {
        console.log('Max attempts reached, could not place all structures.');
    }
}

function getRandomAction(zombie, actions) {
    actions = actions.filter(action => action); // Filter out undefined actions
    const randomIndex = Math.floor(Math.random() * actions.length);
    return actions[randomIndex];
}




function switchAction(zombie, toAction) {
    if (zombie.activeAction !== toAction) {
        if (zombie.activeAction) zombie.activeAction.fadeOut(0.5); // Smooth transition between animations
        toAction.reset().fadeIn(0.5).play(); // Play the new animation
        zombie.activeAction = toAction; // Update the active action
    }
}

function handleZombies(delta,controls){
    zombies.forEach(zombie => {
        const { fbx, mixer } = zombie;
        if (mixer) mixer.update(delta);

        const zombiePosition = new THREE.Vector3();
        const cameraPosition = new  THREE.Vector3(controls.object.position.x, controls.object.position.y, controls.object.position.z);
        fbx.getWorldPosition(zombiePosition);
        

        const direction = new THREE.Vector3().subVectors(cameraPosition, zombiePosition).normalize();
        fbx.lookAt(cameraPosition);

        const distanceToCamera = zombiePosition.distanceTo(cameraPosition);


        if (!zombie.isDead && isShiftPressed) {
            zombie.life--;
            console.log(`Zombie life: ${zombie.life}`);

            if (zombie.life <= 0) {
                console.log('Zombie is dying');
                zombie.isDead = true;

                const actions = [zombie.Dying1, zombie.Dying2]; 
                zombie.chosenAction = getRandomAction(zombie, actions);
                switchAction(zombie, zombie.chosenAction);
                return; 
            }
        }

        if (zombie.isDead) {

            if (zombie.chosenAction && !zombie.chosenAction.isRunning()) {
                scene.remove(zombie.fbx);
                zombies.splice(zombies.indexOf(zombie), 1); 
            }
            return; 
        }

     
        if (distanceToCamera > minimumDistance) {
            zombie.actionChosen = false; 
            fbx.position.add(direction.multiplyScalar(zombieSpeed)); 

     
            if (zombie.runAction) {
                switchAction(zombie, zombie.runAction);
            }
        } else {

            const actions = [
                zombie.punchAction,
                zombie.biteAction,
                zombie.biteNeckAction
            ];
            if (!zombie.actionChosen) {
                zombie.chosenAction = getRandomAction(zombie, actions);
                zombie.actionChosen = true;
            }

            if (zombie.chosenAction) {
                switchAction(zombie, zombie.chosenAction);
            }
        }
    });
}




        
      


        // Set up controls
        const controls = new PointerLockControls(camera, document.body);

        createZombie('/Warzombie.fbx', new THREE.Vector3(controls.object.position.x, 0, controls.object.position.z+200));
        createZombie('/YakuZombie.fbx', new THREE.Vector3(controls.object.position.x+200, 0, controls.object.position.z));
        createZombie('/Zombiegirl.fbx', new THREE.Vector3(controls.object.position.x-200, 0, controls.object.position.z-200));


        let moveForward = false;
        let moveBackward = false;
        let moveLeft = false;
        let moveRight = false;
        let canJump = false;
        let velocityY = 0;
        const gravity = -9.8;
        const jumpHeight = 5;
        let isOnGround = true;
        let isShiftPressed = false;

        const onKeyDown = function (event) {
            switch (event.code) {
                case 'ShiftLeft':
                    console.log("Shift is being pressed")
                    isShiftPressed = true;
                    break;
                case 'KeyW':
                    moveForward = true;
                    break;
                case 'KeyA':
                    moveLeft = true;
                    break;
                case 'KeyS':
                    moveBackward = true;
                    break;
                case 'KeyD':
                    moveRight = true;
                    break;
                case 'Space':
                    if (isOnGround) {
                        velocityY = jumpHeight;
                        isOnGround = false;
                    }
                    break;
            }
        };

        const onKeyUp = function (event) {
            switch (event.code) {
                case 'ShiftLeft':
                    isShiftPressed = false;
                    break;
                case 'KeyW':
                    moveForward = false;
                    break;
                case 'KeyA':
                    moveLeft = false;
                    break;
                case 'KeyS':
                    moveBackward = false;
                    break;
                case 'KeyD':
                    moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        document.addEventListener('click', function () {
            controls.lock();
        });

        controls.addEventListener('lock', function () {
            instructions.style.display = 'none';
        });

        controls.addEventListener('unlock', function () {
            instructions.style.display = 'block';
        });

        controls.object.position.set(80, 2, 80);
        scene.add(controls.object);

        // Player bounding box
        const playerBoundingBox = new THREE.Box3(
            new THREE.Vector3(-0.5, 0, -0.5),
            new THREE.Vector3(0.5, 2, 0.5)
        );

        // Animation loop
        const clock = new THREE.Clock();
        function animate() {
            const delta = clock.getDelta();
            handleZombies(delta,controls);
           
            requestAnimationFrame(animate);

            if (controls.isLocked === true) {

               

                const moveSpeed = 10;
                const velocity = new THREE.Vector3();

                if (moveForward) velocity.z += moveSpeed * delta;
                if (moveBackward) velocity.z -= moveSpeed * delta;
                if (moveLeft) velocity.x -= moveSpeed * delta;
                if (moveRight) velocity.x += moveSpeed * delta;

                controls.moveRight(velocity.x);
                controls.moveForward(velocity.z);

                // Apply gravity
                velocityY += gravity * delta;
                const playerPos = controls.object.position.clone();

                // Calculate the new position
                const newPosition = playerPos.clone();
                newPosition.x += velocity.x;
                newPosition.z += velocity.z;
                newPosition.y += velocityY * delta;

                // Get terrain height at the new position
                const terrainHeight = getTerrainHeight(
                    newPosition.x, newPosition.z, 
                    terrainGeometry, width, length, 128
                );
      
                
              

                // Check for collisions with the ground
                if (newPosition.y < terrainHeight+4) {
                    velocityY = 0;
                    newPosition.y = terrainHeight+4;
                    isOnGround = true;
                }

                // Update player bounding box position based on camera
                const playerPosition = controls.object.position;
                playerBoundingBox.min.set(
                    playerPosition.x - 0.5,
                    playerPosition.y - 2,
                    playerPosition.z - 0.5
                );
                playerBoundingBox.max.set(
                    playerPosition.x + 0.5,
                    playerPosition.y,
                    playerPosition.z + 0.5
                );

                // Collision detection: Prevent moving into obstacles
                obstacles.forEach(obstacle => {
                    if (playerBoundingBox.intersectsBox(obstacle.boundingBox)) {
                        // If colliding, stop movement
                        controls.moveRight(-velocity.x);
                        controls.moveForward(-velocity.z);
                    }
                });

                // Keep the player within the arena bounds
                playerPosition.x = Math.max(-width/2-1, Math.min(width/2-1, playerPosition.x));
                playerPosition.z = Math.max(-width/2-1, Math.min(width/2-1, playerPosition.z));
                playerPosition.y = Math.max(playerPosition.y, terrainHeight + 4);

            }
            
                animateSun();
                animateMoon();
                updateSkyColor()
               // controls.getObject().position.set(0, 100, 0); // Set initial camera position when locking

           

            renderer.render(scene, camera);
        }
        animate();

        // Handle window resizing
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
 
// src/app/ModelViewer.js
"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

const ModelViewer = () => {
  const mountRef = useRef(null);
  const character = useRef(null);
  const mixer = useRef(null);
  const clock = new THREE.Clock();
  const currentAnimation = useRef(null);

  const keyStates = {
    ArrowLeft: { pressed: false, startTime: 0 },
    ArrowRight: { pressed: false, startTime: 0 },
  };

  useEffect(() => {
    // Basic Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      100,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5).normalize();
    scene.add(directionalLight);

    camera.position.set(0, 2, 5); // Position the camera to sta close to the character
    camera.lookAt(0, 1, 0);

    // Ground setup
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Load animations
    const loader = new FBXLoader();
    const animations = {};

    const loadAnimation = (path, name) => {
      return new Promise((resolve) => {
        loader.load(path, (fbx) => {
          const anim = fbx.animations[0];
          animations[name] = anim;
          resolve();
        });
      });
    };

    Promise.all([
      loadAnimation("/models/Start.fbx", "Start"),
      loadAnimation("/models/Walking.fbx", "Walking"),
      loadAnimation("/models/Running.fbx", "Running"),
      loadAnimation("/models/JumpUp.fbx", "JumpUp"),
      loadAnimation("/models/JumpDown.fbx", "JumpDown"),
    ]).then(() => {
      loader.load("/models/Start.fbx", (fbx) => {
        character.current = fbx;
        character.current.scale.set(0.01, 0.01, 0.01); // Adjust the scale
        character.current.rotation.y = Math.PI; // Initial orientation to face "back"
        scene.add(character.current);

        mixer.current = new THREE.AnimationMixer(character.current);
        playAnimation("Start"); // Start with the initial animation

        animate();
      });
    });

    // Play animation only if it's different from the current one
    const playAnimation = (name) => {
      if (
        currentAnimation.current !== name &&
        mixer.current &&
        animations[name]
      ) {
        mixer.current.stopAllAction();
        const action = mixer.current.clipAction(animations[name]);
        action.reset().play();
        currentAnimation.current = name;
      }
    };

    // Keyboard controls
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (!keyStates[event.key].pressed) {
          keyStates[event.key].pressed = true;
          keyStates[event.key].startTime = Date.now();

          // Start with walking animation
          playAnimation("Walking");
        }
        // Rotate character to the correct direction
        if (event.key === "ArrowLeft") character.current.rotation.y = 3. / 2 * Math.PI; // Face left
        if (event.key === "ArrowRight") character.current.rotation.y = 1. / 2 * Math.PI; // Face right
      }
      if (event.key === "ArrowUp") playAnimation("JumpUp");
      if (event.key === "ArrowDown") playAnimation("JumpDown");
    };

    const handleKeyUp = (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        keyStates[event.key].pressed = false;

        // If neither key is pressed, return to "back" orientation and idle animation
        if (
          !keyStates["ArrowLeft"].pressed &&
          !keyStates["ArrowRight"].pressed
        ) {
          playAnimation("Start");
          character.current.rotation.y = Math.PI; // Turn back
        }
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        playAnimation("Start");
        character.current.rotation.y = 2 * Math.PI; // Turn back
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer.current) mixer.current.update(delta);

      // Check for running transition if the key is held down for more than 1 second
      ["ArrowLeft", "ArrowRight"].forEach((key) => {
        if (keyStates[key].pressed) {
          const elapsedTime = Date.now() - keyStates[key].startTime;
          if (elapsedTime > 1000) {
            playAnimation("Running");
          }
        }
      });

      // Move character on the ground and update camera position
      if (character.current) {
        const moveSpeed =
          keyStates["ArrowLeft"].pressed || keyStates["ArrowRight"].pressed
            ? Date.now() - keyStates["ArrowLeft"].startTime > 1000 ||
              Date.now() - keyStates["ArrowRight"].startTime > 1000
              ? 0.1
              : 0.05
            : 0;

        if (keyStates["ArrowLeft"].pressed)
          character.current.position.x -= moveSpeed;
        if (keyStates["ArrowRight"].pressed)
          character.current.position.x += moveSpeed;

        // Keep camera following the character
        camera.position.x = character.current.position.x;
        camera.position.y = 2;
        camera.position.z = 5;
        camera.lookAt(
          character.current.position.x,
          character.current.position.y + 1,
          character.current.position.z
        );
      }

      renderer.render(scene, camera);
    };

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default ModelViewer;


import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { PLAYER_SPEED, RUN_MULTIPLIER, SENSITIVITY, STAMINA_DRAIN, STAMINA_REGEN } from '../constants';

const Player: React.FC = () => {
  const { camera, scene, size } = useThree();
  const playerGroupRef = useRef<THREE.Group>(null);
  const characterRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const gunRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);

  const [, getKeys] = useKeyboardControls();
  const { 
    ammo, stamina, weather, isAimAssistEnabled, useAmmo, reloadAmmo, setStamina,
    isCrouching, isProne, isAiming, setAiming, setPosture, jumpTriggered, shootTriggered, joystickMove
  } = useGameStore();
  
  const [lastShot, setLastShot] = useState(0);
  const isNearAnimal = useRef(false);

  // Physics States
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  const lastJumpCount = useRef(jumpTriggered);
  const lastShootCount = useRef(shootTriggered);

  const cameraRotation = useRef(new THREE.Euler(-0.2, 0, 0, 'YXZ'));
  const currentSway = useRef(new THREE.Vector2(0, 0));
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const shoot = useCallback(() => {
    const now = Date.now();
    if (ammo <= 0 || now - lastShot < 350) return;

    useAmmo();
    setLastShot(now);

    if (flashRef.current) {
      flashRef.current.intensity = 15;
      setTimeout(() => { if (flashRef.current) flashRef.current.intensity = 0; }, 40);
    }
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const weatherInaccuracy = weather === 'stormy' ? 0.012 : (weather === 'rainy' ? 0.006 : 0);
    const postureStability = isProne ? 0.2 : (isCrouching ? 0.4 : 1.0);
    const staminaEffect = (100 - stamina) * 0.0005;
    
    // Dampen penalties significantly when aiming (holding breath focus)
    const aimDamping = isAiming ? 0.35 : 1.0;
    const finalInaccuracy = (staminaEffect + (isAiming ? 0.002 : 0.02) + weatherInaccuracy) * postureStability * aimDamping;
    
    raycaster.ray.direction.x += (Math.random() - 0.5) * finalInaccuracy;
    raycaster.ray.direction.y += (Math.random() - 0.5) * finalInaccuracy;
    raycaster.ray.direction.normalize();

    const intersects = raycaster.intersectObjects(scene.children, true);
    const target = intersects.find(i => i.object.userData?.isAnimal);

    if (target) {
        const onAnimalHit = target.object.userData?.onHit;
        if (onAnimalHit) onAnimalHit(target.point);
    }
  }, [ammo, camera, scene, useAmmo, lastShot, stamina, isAiming, weather, isProne, isCrouching]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.joystick-zone')) return;
      if (e.button === 2 || e.clientX >= size.width * 0.4) {
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
      if (e.button === 2) setAiming(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        const assistFactor = (isAimAssistEnabled && isNearAnimal.current && isAiming) ? 0.35 : 1.0;
        cameraRotation.current.y -= dx * SENSITIVITY * assistFactor;
        cameraRotation.current.x -= dy * SENSITIVITY * assistFactor;
        cameraRotation.current.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/4, cameraRotation.current.x));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDragging.current = false;
      if (e.button === 2) setAiming(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'r') reloadAmmo();
      if (key === 'c') setPosture(isCrouching ? 'standing' : 'crouching');
      if (key === 'z') setPosture(isProne ? 'standing' : 'prone');
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reloadAmmo, size, isAimAssistEnabled, isAiming, camera, setAiming, isCrouching, isProne, setPosture]);

  useFrame((state, delta) => {
    if (!playerGroupRef.current || !characterRef.current) return;

    const { forward, backward, left, right, jump } = getKeys();
    const moveZ = (forward ? 1 : 0) - (backward ? 1 : 0) + joystickMove.y;
    const moveX = (left ? 1 : 0) - (right ? 1 : 0) - joystickMove.x;
    const isMoving = Math.abs(moveZ) > 0.01 || Math.abs(moveX) > 0.01;
    
    let speed = PLAYER_SPEED;
    if (isAiming) speed *= 0.4;
    if (isCrouching) speed *= 0.5;
    if (isProne) speed *= 0.2;

    if ((jump || jumpTriggered > lastJumpCount.current) && isGrounded.current && !isProne) {
      verticalVelocity.current = 10.0;
      isGrounded.current = false;
      lastJumpCount.current = jumpTriggered;
    }
    
    if (shootTriggered > lastShootCount.current) {
      shoot();
      lastShootCount.current = shootTriggered;
    }

    if (!isGrounded.current) {
      verticalVelocity.current -= 25.0 * delta;
      playerGroupRef.current.position.y += verticalVelocity.current * delta;
      if (playerGroupRef.current.position.y <= 0) {
        playerGroupRef.current.position.y = 0;
        verticalVelocity.current = 0;
        isGrounded.current = true;
      }
    }

    // Refined Aiming Sway System
    const time = state.clock.getElapsedTime();
    const weatherSway = (weather === 'stormy' ? 0.015 : (weather === 'rainy' ? 0.005 : 0));
    const staminaPenalty = (100 - stamina) * 0.00015;
    const aimFocusMult = isAiming ? 0.3 : 1.0;
    const postureMult = isProne ? 0.2 : (isCrouching ? 0.6 : 1.0);
    
    const targetSwayX = Math.sin(time * 0.8) * (staminaPenalty + weatherSway) * aimFocusMult * postureMult;
    const targetSwayY = Math.cos(time * 1.2) * (staminaPenalty + weatherSway) * aimFocusMult * postureMult;
    
    currentSway.current.x = THREE.MathUtils.lerp(currentSway.current.x, targetSwayX, 0.1);
    currentSway.current.y = THREE.MathUtils.lerp(currentSway.current.y, targetSwayY, 0.1);

    const tempEuler = cameraRotation.current.clone();
    tempEuler.x += currentSway.current.y;
    tempEuler.y += currentSway.current.x;
    camera.quaternion.setFromEuler(tempEuler);

    const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const camFlatDir = camDir.clone(); camFlatDir.y = 0; camFlatDir.normalize();
    const camSide = new THREE.Vector3().crossVectors(camFlatDir, new THREE.Vector3(0, 1, 0));
    
    const moveVector = new THREE.Vector3(0, 0, 0);
    moveVector.addScaledVector(camFlatDir, moveZ * speed);
    moveVector.addScaledVector(camSide, -moveX * speed);
    playerGroupRef.current.position.add(moveVector);

    if (isAiming || isMoving) {
        const targetRot = isAiming ? cameraRotation.current.y : Math.atan2(moveVector.x, moveVector.z);
        characterRef.current.rotation.y = THREE.MathUtils.lerp(characterRef.current.rotation.y, targetRot, 0.2);
    }

    let targetHeight = 2.2;
    if (isCrouching) targetHeight = 1.4;
    else if (isProne) targetHeight = 0.5;
    
    const orbitDistance = isAiming ? 2.5 : 5.0;
    const sideOffset = isAiming ? 0.7 : 0;
    const relativeOffset = new THREE.Vector3(sideOffset, 0, orbitDistance).applyQuaternion(camera.quaternion);
    const targetCamPos = playerGroupRef.current.position.clone().add(new THREE.Vector3(0, targetHeight, 0)).add(relativeOffset);
    camera.position.lerp(targetCamPos, 0.15);

    characterRef.current.scale.y = THREE.MathUtils.lerp(characterRef.current.scale.y, isProne ? 0.3 : (isCrouching ? 0.6 : 1.0), 0.1);

    if (gunRef.current) {
        const breathSway = Math.sin(time * 1.2) * (isAiming ? 0.005 : 0.015);
        gunRef.current.position.x = THREE.MathUtils.lerp(gunRef.current.position.x, (isAiming ? 0.1 : 0.2) + breathSway, 0.1);
        gunRef.current.position.y = THREE.MathUtils.lerp(gunRef.current.position.y, (isAiming ? -0.15 : -0.3) + breathSway, 0.1);
    }
  });

  return (
    <group ref={playerGroupRef} position={[0, 0, 0]}>
      <group ref={characterRef}>
        <mesh castShadow position={[0, 1.25, 0]}>
          <boxGeometry args={[0.6, 0.9, 0.35]} />
          <meshStandardMaterial color="#2d3a2b" />
        </mesh>
        <group position={[0, 1.85, 0]}>
          <mesh castShadow><boxGeometry args={[0.26, 0.32, 0.26]} /><meshStandardMaterial color="#cfa880" /></mesh>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.28, 0.1, 0.28]} /><meshStandardMaterial color="#111" /></mesh>
        </group>
        <group position={[0.4, 1.6, 0]} ref={rightArmRef}>
          <mesh castShadow position={[0, -0.25, 0]}><capsuleGeometry args={[0.09, 0.5, 4, 12]} /><meshStandardMaterial color="#2d3a2b" /></mesh>
          <group ref={gunRef} position={[0.2, -0.3, 0.3]}>
            <mesh castShadow position={[0, 0, 0.45]}><boxGeometry args={[0.07, 0.16, 0.5]} /><meshStandardMaterial color="#3d2b1f" /></mesh>
            <mesh castShadow><boxGeometry args={[0.09, 0.1, 0.8]} /><meshStandardMaterial color="#111" metalness={0.8} /></mesh>
            <mesh castShadow position={[0, 0.02, -0.8]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.022, 0.022, 1.2]} /><meshStandardMaterial color="#000" metalness={1} /></mesh>
            <pointLight ref={flashRef} color="#ffd27d" intensity={0} distance={10} position={[0, 0.02, -1.5]} />
          </group>
        </group>
        <group ref={leftLegRef} position={[-0.18, 0.6, 0]}><mesh castShadow position={[0, -0.3, 0]}><capsuleGeometry args={[0.13, 0.6, 4, 12]} /><meshStandardMaterial color="#1c2526" /></mesh></group>
        <group ref={rightLegRef} position={[0.18, 0.6, 0]}><mesh castShadow position={[0, -0.3, 0]}><capsuleGeometry args={[0.13, 0.6, 4, 12]} /><meshStandardMaterial color="#1c2526" /></mesh></group>
      </group>
    </group>
  );
};

export default Player;

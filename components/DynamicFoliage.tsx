
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FOLIAGE_COUNT, WORLD_SIZE } from '../constants';
import { useGameStore } from '../store/useGameStore';

const DynamicFoliage: React.FC = () => {
  const { weather } = useGameStore();
  const { camera, scene } = useThree();
  const count = FOLIAGE_COUNT;
  
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const foliageData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * WORLD_SIZE * 1.8;
      const z = (Math.random() - 0.5) * WORLD_SIZE * 1.8;
      data.push({
        pos: new THREE.Vector3(x, 0, z),
        rot: Math.random() * Math.PI * 2,
        scale: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const windSpeed = weather === 'stormy' ? 4 : (weather === 'rainy' ? 2 : 1);
    const windStrength = weather === 'stormy' ? 0.3 : 0.1;

    // We only care about things that move: player and animals
    // In this simple implementation, we'll just use the camera position as player proxy
    const playerPos = camera.position.clone();
    playerPos.y = 0;

    for (let i = 0; i < count; i++) {
      const f = foliageData[i];
      const distToPlayer = f.pos.distanceTo(playerPos);
      
      dummy.position.copy(f.pos);
      dummy.rotation.set(0, f.rot, 0);
      dummy.scale.set(f.scale, f.scale, f.scale);

      // Idle Wind Sway
      const sway = Math.sin(time * windSpeed + f.phase) * windStrength;
      dummy.rotation.x += sway;
      dummy.rotation.z += sway * 0.5;

      // Movement Bending Interaction
      // If player is close, bend away
      if (distToPlayer < 2.5) {
        const bendStrength = (1 - distToPlayer / 2.5) * 0.8;
        const dir = f.pos.clone().sub(playerPos).normalize();
        dummy.rotation.x += dir.z * bendStrength;
        dummy.rotation.z -= dir.x * bendStrength;
        // Squash slightly
        dummy.scale.y *= (1 - bendStrength * 0.5);
      }

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} receiveShadow>
      <coneGeometry args={[0.2, 0.8, 3]} />
      <meshStandardMaterial color="#2d5a27" roughness={1} />
    </instancedMesh>
  );
};

export default DynamicFoliage;

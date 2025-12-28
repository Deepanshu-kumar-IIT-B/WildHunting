
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

const MAX_BLOOD_POINTS = 500;

const BloodTrails: React.FC = () => {
  const { bloodTrails, cleanOldTrails } = useGameStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Periodically clean old trails via store logic
    if (state.clock.elapsedTime % 10 < 0.05) cleanOldTrails();

    const now = Date.now();
    
    for (let i = 0; i < MAX_BLOOD_POINTS; i++) {
      const trail = bloodTrails[bloodTrails.length - 1 - i];
      if (trail) {
        const age = now - trail.timestamp;
        const life = Math.max(0, 1 - age / 60000);
        
        if (life > 0) {
          dummy.position.set(trail.position[0], 0.02, trail.position[2]);
          dummy.scale.set(life * 0.2, life * 0.01, life * 0.2);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
      } else {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_BLOOD_POINTS]}>
      <circleGeometry args={[1, 8]} />
      <meshBasicMaterial color="#800000" transparent opacity={0.8} />
    </instancedMesh>
  );
};

export default BloodTrails;

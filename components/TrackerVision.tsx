
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

const MAX_POINTS = 1000;

const TrackerVision: React.FC = () => {
  const { isTrackerVision, scentTrails, cleanOldTrails } = useGameStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Periodically clean old trails
    if (state.clock.elapsedTime % 5 < 0.05) cleanOldTrails();

    const now = Date.now();
    
    for (let i = 0; i < MAX_POINTS; i++) {
      const trail = scentTrails[scentTrails.length - 1 - i];
      if (trail && isTrackerVision) {
        const age = now - trail.timestamp;
        const life = Math.max(0, 1 - age / 30000);
        
        dummy.position.set(trail.position[0], 0.1, trail.position[2]);
        dummy.scale.set(life * 0.4, life * 0.4, life * 0.4);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.visible = isTrackerVision;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_POINTS]}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial color="#00ffcc" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
};

export default TrackerVision;

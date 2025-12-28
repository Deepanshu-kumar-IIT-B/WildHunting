
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD_SIZE } from '../constants';

const DESTRUCTIBLE_COUNT = 150;
const GRAVITY = -25.0; // Strong gravity to keep stones grounded

interface ObjectState {
  position: THREE.Vector3;
  type: 'rock' | 'branch';
  scale: number;
  destroyed: boolean;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  life: number;
}

const Interactables: React.FC = () => {
  const { camera } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const audioCtx = useRef<AudioContext | null>(null);

  const objects = useMemo(() => {
    const data: ObjectState[] = [];
    for (let i = 0; i < DESTRUCTIBLE_COUNT; i++) {
      data.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * WORLD_SIZE * 1.8,
          0.1,
          (Math.random() - 0.5) * WORLD_SIZE * 1.8
        ),
        type: Math.random() > 0.5 ? 'rock' : 'branch',
        scale: 0.5 + Math.random() * 0.8,
        destroyed: false,
        rotation: new THREE.Euler(0, Math.random() * Math.PI, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        life: 1.0
      });
    }
    return data;
  }, []);

  const playSnap = (type: string, dist: number) => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type === 'rock' ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(type === 'rock' ? 40 : 150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(Math.max(0, 0.1 * (1 - dist / 15)), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const playerPos = camera.position.clone();
    playerPos.y = 0;

    // Limit delta to prevent physics jumps on lag
    const dt = Math.min(delta, 0.05);

    objects.forEach((obj, i) => {
      if (obj.destroyed) {
        // Shatter physics
        if (obj.life > 0) {
          obj.velocity.y += GRAVITY * dt;
          obj.position.addScaledVector(obj.velocity, dt);
          obj.life -= dt * 0.8; // Objects fade/shrink out
          
          if (obj.position.y < 0) {
            obj.position.y = 0;
            obj.velocity.set(0, 0, 0);
          }

          const currentScale = obj.scale * Math.max(0, obj.life);
          dummy.position.copy(obj.position);
          dummy.rotation.copy(obj.rotation);
          dummy.scale.set(currentScale, currentScale, currentScale);
        } else {
          dummy.scale.set(0, 0, 0);
        }
      } else {
        const dist = obj.position.distanceTo(playerPos);
        // Interaction trigger
        if (dist < 1.3) {
          obj.destroyed = true;
          playSnap(obj.type, dist);
          // Small realistic burst force, not flying away
          obj.velocity.set(
            (Math.random() - 0.5) * 2,
            2 + Math.random() * 2,
            (Math.random() - 0.5) * 2
          );
        }
        dummy.position.copy(obj.position);
        dummy.rotation.copy(obj.rotation);
        dummy.scale.set(obj.scale, obj.scale, obj.scale);
      }
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DESTRUCTIBLE_COUNT]} castShadow>
      <dodecahedronGeometry args={[0.3]} />
      <meshStandardMaterial color="#555" roughness={0.9} />
    </instancedMesh>
  );
};

export default Interactables;

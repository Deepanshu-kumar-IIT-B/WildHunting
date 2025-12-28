
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import { Animal, AnimalBehavior } from '../types';
import { ANIMAL_TYPES, WORLD_SIZE, ANIMAL_SPAWN_LIMIT, DETECTION } from '../constants';
import { useGameStore } from '../store/useGameStore';

const AnimalEntity: React.FC<{ 
  data: Animal; 
  onKilled: (a: Animal) => void;
  groupCentroid: THREE.Vector3 | null;
  otherAnimals: Animal[];
}> = ({ data, onKilled, groupCentroid, otherAnimals }) => {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(...data.position));
  const currentPos = useRef(new THREE.Vector3(...data.position));
  const [behavior, setBehavior] = useState<AnimalBehavior>(data.behavior);
  const [isDead, setIsDead] = useState(false);
  const [health, setHealth] = useState(data.health);
  const initialHealth = useMemo(() => data.health, []);
  const { stamina, weather, addScentPoint, addBloodPoint } = useGameStore();

  const lastAiUpdate = useRef(0);
  const lastScentPoint = useRef(0);
  const lastBloodPoint = useRef(0);
  const audioCtx = useRef<AudioContext | null>(null);

  const isWounded = health < initialHealth;

  const playCall = (isAlert: boolean = false) => {
    if (isDead) return;
    if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();

    const dist = currentPos.current.distanceTo(camera.position);
    if (dist > 60) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const config = ANIMAL_TYPES.find(t => t.type === data.type)!;

    const volume = Math.max(0, (1 - dist / 60) * (isAlert ? 0.25 : 0.1));
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isAlert ? 0.5 : 1.2));

    osc.frequency.setValueAtTime(config.callFreq, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (isAlert ? 0.5 : 1.5));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDead || behavior === 'flee') return;
      
      // Boundary Check: If too far out, head back to center
      const distFromCenter = currentPos.current.length();
      if (distFromCenter > WORLD_SIZE * 0.8) {
        setBehavior('wander');
        targetPos.current.set(0, 0, 0).add(new THREE.Vector3((Math.random()-0.5)*50, 0, (Math.random()-0.5)*50));
        return;
      }

      if (Math.random() > 0.85) playCall(false);
      
      if (Math.random() > 0.8) {
        setBehavior('idle');
      } else {
        setBehavior('wander');
        const randomOffset = new THREE.Vector3((Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30);
        if (groupCentroid && Math.random() > 0.4) {
           const toGroup = groupCentroid.clone().sub(currentPos.current).normalize().multiplyScalar(15);
           targetPos.current.copy(currentPos.current).add(toGroup).add(randomOffset);
        } else {
           targetPos.current.set(currentPos.current.x + randomOffset.x, 0, currentPos.current.z + randomOffset.z);
        }
      }
    }, 5000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [isDead, behavior, groupCentroid]);

  useFrame((state, delta) => {
    if (isDead || !meshRef.current) return;

    const now = state.clock.elapsedTime;

    // Scent/Blood logic
    if (behavior !== 'idle' && now - lastScentPoint.current > 2.5) {
      lastScentPoint.current = now;
      addScentPoint({ position: [currentPos.current.x, 0, currentPos.current.z], animalType: data.type, timestamp: Date.now() });
    }
    if (isWounded && behavior !== 'idle' && now - lastBloodPoint.current > 1.0) {
      lastBloodPoint.current = now;
      addBloodPoint({ position: [currentPos.current.x, 0.02, currentPos.current.z], timestamp: Date.now() });
    }

    // Perception logic
    if (now - lastAiUpdate.current > 0.4) {
      lastAiUpdate.current = now;
      const playerPos = new THREE.Vector3(camera.position.x, 0, camera.position.z);
      const dist = currentPos.current.distanceTo(playerPos);
      
      let visibilityMod = weather === 'foggy' ? 0.4 : (weather === 'stormy' ? 0.35 : 1.0);
      let hearingMod = weather === 'stormy' ? 0.4 : 1.0;

      if (dist < DETECTION.SIGHT_RANGE * visibilityMod || dist < DETECTION.SCENT_RANGE || (dist < (stamina < 90 ? DETECTION.HEARING_RANGE.RUN : 15) * hearingMod)) {
        if (behavior !== 'flee') {
          setBehavior('alert');
          if (dist < 18) {
             setBehavior('flee');
             targetPos.current.copy(currentPos.current).add(currentPos.current.clone().sub(playerPos).normalize().multiplyScalar(50));
          }
        }
      }
    }

    // Movement
    const woundedPenalty = isWounded ? 0.55 : 1.0;
    const speed = (behavior === 'flee' ? 0.22 : (behavior === 'wander' ? 0.045 : 0)) * woundedPenalty;

    if (behavior !== 'idle' && currentPos.current.distanceTo(targetPos.current) > 1.5) {
      currentPos.current.lerp(targetPos.current, speed * delta * 8);
      meshRef.current.position.copy(currentPos.current);
      
      const lookTarget = new THREE.Vector3(targetPos.current.x, meshRef.current.position.y, targetPos.current.z);
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(meshRef.current.position, lookTarget, new THREE.Vector3(0, 1, 0)));
      meshRef.current.quaternion.slerp(q, 0.1);
      
      // Simple walk bobbing
      meshRef.current.position.y = Math.abs(Math.sin(now * (behavior === 'flee' ? 10 : 4))) * 0.15;
    }

    if (isWounded) {
      const pulse = (Math.sin(now * 6) + 1) * 0.1;
      meshRef.current.scale.set(1+pulse, 1+pulse, 1+pulse);
    }

    data.position[0] = currentPos.current.x;
    data.position[1] = currentPos.current.y;
    data.position[2] = currentPos.current.z;
  });

  const handleHit = (hitPoint: THREE.Vector3) => {
    if (isDead) return;
    const damage = data.type === 'bear' ? 40 : 100;
    const newHealth = health - damage;
    setHealth(newHealth);
    setBehavior('flee');
    targetPos.current.add(currentPos.current.clone().sub(hitPoint).normalize().multiplyScalar(60));
    if (newHealth <= 0) { setIsDead(true); onKilled(data); }
  };

  const config = ANIMAL_TYPES.find(t => t.type === data.type)!;

  return (
    <group ref={meshRef} position={data.position} userData={{ isAnimal: true, onHit: handleHit }}>
      {!isDead ? (
        <group>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.8, 1.4]} />
            <meshStandardMaterial color={isWounded ? '#700' : config.color} roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 0.4, 0.7]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color={config.color} />
          </mesh>
          {[[-0.2, -0.6, 0.4], [0.2, -0.6, 0.4], [-0.2, -0.6, -0.4], [0.2, -0.6, -0.4]].map((p, i) => (
            <mesh key={i} position={p as any} castShadow>
              <boxGeometry args={[0.15, 0.5, 0.15]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh rotation={[Math.PI/2.2, 0, 0]} position={[0, 0.2, 0]}>
          <boxGeometry args={[0.8, 1.5, 0.5]} />
          <meshStandardMaterial color="#222" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

const AnimalsController: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const { addScore, recordHunt, setAnimalsCount } = useGameStore();
  const [centroids, setCentroids] = useState<Record<string, THREE.Vector3>>({});

  useEffect(() => {
    const newAnimals: Animal[] = [];
    ANIMAL_TYPES.forEach(config => {
      const count = Math.floor(ANIMAL_SPAWN_LIMIT / ANIMAL_TYPES.length);
      for (let i = 0; i < count; i++) {
        // Fix: config.type is now correctly inferred as literal union due to 'as const' in constants.ts
        newAnimals.push({
          id: uuidv4(),
          type: config.type,
          position: [(Math.random()-0.5)*WORLD_SIZE*1.5, 0.5, (Math.random()-0.5)*WORLD_SIZE*1.5],
          rotation: Math.random() * Math.PI * 2,
          health: config.health,
          isDead: false,
          behavior: 'wander'
        });
      }
    });
    setAnimals(newAnimals);
    setAnimalsCount(newAnimals.length);
  }, [setAnimalsCount]);

  useFrame((state) => {
    if (state.clock.elapsedTime % 1.5 < 0.05) {
       const newCentroids: Record<string, THREE.Vector3> = {};
       const counts: Record<string, number> = {};
       animals.forEach(a => {
         if (a.isDead) return;
         if (!newCentroids[a.type]) { newCentroids[a.type] = new THREE.Vector3(0, 0, 0); counts[a.type] = 0; }
         newCentroids[a.type].x += a.position[0];
         newCentroids[a.type].z += a.position[2];
         counts[a.type]++;
       });
       Object.keys(newCentroids).forEach(type => counts[type] > 0 && newCentroids[type].divideScalar(counts[type]));
       setCentroids(newCentroids);
    }
  });

  const onKilled = (animal: Animal) => {
    const config = ANIMAL_TYPES.find(t => t.type === animal.type)!;
    addScore(config.score);
    recordHunt({ animalType: animal.type, timestamp: Date.now(), distance: 0, score: config.score });
    setTimeout(() => {
      setAnimals(prev => {
        const next = prev.filter(a => a.id !== animal.id);
        // Fix: config.type now correctly satisfies Animal['type'] union because of 'as const' in constants.ts
        next.push({
            id: uuidv4(),
            type: config.type,
            position: [(Math.random()-0.5)*WORLD_SIZE*1.5, 0.5, (Math.random()-0.5)*WORLD_SIZE*1.5],
            rotation: Math.random()*Math.PI*2,
            health: config.health,
            isDead: false,
            behavior: 'wander'
        });
        setAnimalsCount(next.length);
        return next;
      });
    }, 20000);
  };

  return (
    <>
      {animals.map(a => (
        <AnimalEntity key={a.id} data={a} onKilled={onKilled} groupCentroid={centroids[a.type] || null} otherAnimals={animals} />
      ))}
    </>
  );
};

export default AnimalsController;

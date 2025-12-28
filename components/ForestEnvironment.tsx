
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { TREE_COUNT, WORLD_SIZE } from '../constants';

const ForestEnvironment: React.FC = () => {
  const ROCK_COUNT = 150;
  
  // Use a Grid-Jitter algorithm for even distribution
  const [treePositions, treeRotations, treeScales] = useMemo(() => {
    const pos = [];
    const rot = [];
    const sca = [];
    
    // Calculate grid size based on tree count and world size
    const gridSize = Math.ceil(Math.sqrt(TREE_COUNT));
    const step = (WORLD_SIZE * 2) / gridSize;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (pos.length >= TREE_COUNT) break;
        
        // Base grid position
        const baseX = -WORLD_SIZE + i * step;
        const baseZ = -WORLD_SIZE + j * step;
        
        // Add random jitter within the cell
        const x = baseX + (Math.random() - 0.5) * step * 0.8;
        const z = baseZ + (Math.random() - 0.5) * step * 0.8;
        
        // Skip player start zone (center)
        if (Math.sqrt(x*x + z*z) < 18) continue;
        
        pos.push(new THREE.Vector3(x, 0, z));
        rot.push(Math.random() * Math.PI * 2);
        sca.push(0.9 + Math.random() * 1.4);
      }
    }
    return [pos, rot, sca];
  }, []);

  const [rockData] = useMemo(() => {
    const data = [];
    for (let i = 0; i < ROCK_COUNT; i++) {
      data.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * WORLD_SIZE * 1.9,
          0,
          (Math.random() - 0.5) * WORLD_SIZE * 1.9
        ),
        rot: new THREE.Euler(Math.random(), Math.random(), Math.random()),
        scale: 0.5 + Math.random() * 1.5
      });
    }
    return [data];
  }, []);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!trunkRef.current || !foliageRef.current || !rockRef.current) return;
    
    // Set trees
    treePositions.forEach((p, i) => {
      // Trunk
      dummy.position.copy(p);
      dummy.rotation.set(0, treeRotations[i], 0);
      dummy.scale.set(treeScales[i], treeScales[i] * 1.8, treeScales[i]);
      dummy.updateMatrix();
      trunkRef.current!.setMatrixAt(i, dummy.matrix);

      // Foliage (offset from trunk)
      dummy.position.y = treeScales[i] * 2.8;
      dummy.scale.set(treeScales[i] * 2.5, treeScales[i] * 3.5, treeScales[i] * 2.5);
      dummy.updateMatrix();
      foliageRef.current!.setMatrixAt(i, dummy.matrix);
    });

    // Set rocks
    rockData.forEach((r, i) => {
      dummy.position.copy(r.pos);
      dummy.rotation.copy(r.rot);
      dummy.scale.set(r.scale, r.scale * 0.7, r.scale);
      dummy.updateMatrix();
      rockRef.current!.setMatrixAt(i, dummy.matrix);
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    foliageRef.current.instanceMatrix.needsUpdate = true;
    rockRef.current.instanceMatrix.needsUpdate = true;
  }, [treePositions, treeRotations, treeScales, rockData, dummy]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, treePositions.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.45, 3, 8]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.9} />
      </instancedMesh>
      
      <instancedMesh ref={foliageRef} args={[undefined, undefined, treePositions.length]} castShadow>
        <coneGeometry args={[1.2, 2.5, 7]} />
        <meshStandardMaterial color="#1a311a" roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={rockRef} args={[undefined, undefined, ROCK_COUNT]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1]} />
        <meshStandardMaterial color="#444" roughness={1} />
      </instancedMesh>
    </>
  );
};

export default ForestEnvironment;

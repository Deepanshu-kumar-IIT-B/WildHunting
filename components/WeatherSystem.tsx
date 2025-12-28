
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { WeatherType } from '../types';

const RainParticles: React.FC<{ count: number; active: boolean }> = ({ count, active }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          Math.random() * 50,
          (Math.random() - 0.5) * 100
        ),
        speed: 15 + Math.random() * 10,
      });
    }
    return data;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current || !active) return;
    
    particles.forEach((p, i) => {
      p.position.y -= p.speed * delta;
      if (p.position.y < -5) p.position.y = 40;
      
      // Keep rain centered around the player/camera
      const camPos = state.camera.position;
      dummy.position.set(
        camPos.x + p.position.x,
        p.position.y,
        camPos.z + p.position.z
      );
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.visible = active;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.02, 0.4, 0.02]} />
      <meshBasicMaterial color="#78909c" transparent opacity={0.4} />
    </instancedMesh>
  );
};

const WeatherSystem: React.FC = () => {
  const { weather, setWeather } = useGameStore();
  const { scene } = useThree();
  const audioContext = useRef<AudioContext | null>(null);
  const rainSource = useRef<AudioBufferSourceNode | null>(null);
  const windSource = useRef<AudioBufferSourceNode | null>(null);

  // Cycle weather every 60-120 seconds
  useEffect(() => {
    const cycle = () => {
      const weathers: WeatherType[] = ['clear', 'foggy', 'rainy', 'stormy'];
      const next = weathers[Math.floor(Math.random() * weathers.length)];
      setWeather(next);
      setTimeout(cycle, 45000 + Math.random() * 60000);
    };
    const timer = setTimeout(cycle, 30000);
    return () => clearTimeout(timer);
  }, [setWeather]);

  // Adjust Fog and Lighting
  useEffect(() => {
    switch (weather) {
      case 'foggy':
        scene.fog = new THREE.FogExp2('#455a64', 0.04);
        break;
      case 'rainy':
        scene.fog = new THREE.FogExp2('#263238', 0.025);
        break;
      case 'stormy':
        scene.fog = new THREE.FogExp2('#1a237e', 0.035);
        break;
      default:
        scene.fog = new THREE.FogExp2('#24323a', 0.015);
    }
  }, [weather, scene]);

  // Procedural Sound Logic
  useEffect(() => {
    const startAudio = () => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContext.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Create White Noise for Rain/Wind
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const createSource = (filterFreq: number, q: number) => {
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = q;
        
        const gain = ctx.createGain();
        gain.gain.value = 0;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        return { source, gain, filter };
      };

      const rain = createSource(1500, 1);
      const wind = createSource(400, 5);

      const updateVolume = () => {
        if (weather === 'rainy' || weather === 'stormy') {
          rain.gain.gain.setTargetAtTime(weather === 'stormy' ? 0.08 : 0.04, ctx.currentTime, 1);
        } else {
          rain.gain.gain.setTargetAtTime(0, ctx.currentTime, 1);
        }

        if (weather !== 'clear') {
          wind.gain.gain.setTargetAtTime(weather === 'stormy' ? 0.05 : 0.02, ctx.currentTime, 1);
          wind.filter.frequency.setTargetAtTime(800 + Math.sin(Date.now() * 0.001) * 300, ctx.currentTime, 1);
        } else {
          wind.gain.gain.setTargetAtTime(0.005, ctx.currentTime, 1);
        }
      };

      const interval = setInterval(updateVolume, 100);
      return () => {
        clearInterval(interval);
        rain.source.stop();
        wind.source.stop();
      };
    };

    const handleInteraction = () => {
      startAudio();
      window.removeEventListener('mousedown', handleInteraction);
    };
    window.addEventListener('mousedown', handleInteraction);

    return () => window.removeEventListener('mousedown', handleInteraction);
  }, [weather]);

  return (
    <>
      <RainParticles count={2000} active={weather === 'rainy' || weather === 'stormy'} />
      {weather === 'stormy' && (
        <directionalLight intensity={2} position={[0, 50, 0]} color="#fff" />
      )}
    </>
  );
};

export default WeatherSystem;

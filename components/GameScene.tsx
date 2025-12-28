
import React from 'react';
import Player from './Player';
import ForestEnvironment from './ForestEnvironment';
import AnimalsController from './AnimalsController';
import WeatherSystem from './WeatherSystem';
import DynamicFoliage from './DynamicFoliage';
import TrackerVision from './TrackerVision';
import BloodTrails from './BloodTrails';
import Interactables from './Interactables';
import { WORLD_SIZE } from '../constants';

const GameScene: React.FC = () => {
  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[WORLD_SIZE * 2, WORLD_SIZE * 2]} />
        <meshStandardMaterial color="#1e3314" roughness={1} metalness={0} />
      </mesh>

      <WeatherSystem />
      <ForestEnvironment />
      <DynamicFoliage />
      <Interactables />
      <TrackerVision />
      <BloodTrails />
      <AnimalsController />
      <Player />
    </>
  );
};

export default GameScene;

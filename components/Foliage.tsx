import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface FoliageProps {
  mode: TreeMode;
  count: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  
  attribute vec3 aChaosPos;
  attribute vec3 aTargetPos;
  attribute float aRandom;
  
  varying vec3 vColor;
  varying float vAlpha;

  // Cubic Ease In Out
  float cubicInOut(float t) {
    return t < 0.5
      ? 4.0 * t * t * t
      : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    // Add some individual variation to the progress so they don't all move at once
    float localProgress = clamp(uProgress * 1.2 - aRandom * 0.2, 0.0, 1.0);
    float easedProgress = cubicInOut(localProgress);

    // Interpolate position
    vec3 newPos = mix(aChaosPos, aTargetPos, easedProgress);
    
    // Add a slight "breathing" wind effect when formed
    if (easedProgress > 0.9) {
      newPos.x += sin(uTime * 2.0 + newPos.y) * 0.05;
      newPos.z += cos(uTime * 1.5 + newPos.y) * 0.05;
    }

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    
    // Size attenuation
    gl_PointSize = (4.0 * aRandom + 2.0) * (20.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // --- COLOR MODIFICATION START ---
    // Old Logic: Gold (Chaos) -> Green (Formed)
    // New Logic: Gold (Chaos) -> Deep/Bright Gold (Formed)
    
    // 1. Chaos Color (Still pure gold)
    vec3 chaosGold = vec3(1.0, 0.84, 0.0);
    
    // 2. Formed Colors (Replaced Green with Yellow/Gold spectrum)
    // Deep rich yellow/orange for depth
    vec3 deepGold = vec3(0.85, 0.65, 0.1); 
    // Bright pale yellow for highlights
    vec3 brightGold = vec3(1.0, 0.95, 0.4);
    
    // Mix based on randomness to create texture
    vec3 formedColor = mix(deepGold, brightGold, aRandom * 0.6);
    
    // Sparkle effect
    float sparkle = sin(uTime * 5.0 + aRandom * 100.0);
    
    // Final mix based on progress
    vColor = mix(chaosGold, formedColor, easedProgress);
    
    // Add bright white sparkle to tips occasionally
    if (sparkle > 0.9) {
      vColor += vec3(0.6); // Add white to make it shine
    }
    // --- COLOR MODIFICATION END ---

    vAlpha = 1.0;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Circular particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    // Soft edge
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);

    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

export const Foliage: React.FC<FoliageProps> = ({ mode, count }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  // Target progress reference for smooth JS-side dampening logic for the uniform
  const progressRef = useRef(0);

  const { chaosPositions, targetPositions, randoms } = useMemo(() => {
    const chaos = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const rnd = new Float32Array(count);

    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const height = 12;
    const maxRadius = 5;

    for (let i = 0; i < count; i++) {
      // 1. Chaos Positions
      const r = 25 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 5;
      chaos[i * 3 + 2] = r * Math.cos(phi);

      // 2. Target Positions
      const yNorm = i / count; 
      const y = yNorm * height;
      const currentRadius = maxRadius * (1 - yNorm);
      const angle = 2 * Math.PI * goldenRatio * i;

      target[i * 3] = Math.cos(angle) * currentRadius;
      target[i * 3 + 1] = y;
      target[i * 3 + 2] = Math.sin(angle) * currentRadius;

      // 3. Randoms
      rnd[i] = Math.random();
    }

    return {
      chaosPositions: chaos,
      targetPositions: target,
      randoms: rnd
    };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      const target = mode === TreeMode.FORMED ? 1 : 0;
      progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, delta * 1.5);
      material.uniforms.uProgress.value = progressRef.current;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaosPos" count={count} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aTargetPos" count={count} array={targetPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
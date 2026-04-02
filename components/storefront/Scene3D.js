'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Sphere, Torus, Box, Environment, Stars } from '@react-three/drei';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';

/* ─── Floating Particles ─── */
function Particles({ count = 200, color = '#f97316' }) {
  const mesh = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, [count]);

  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 0.05 + 0.01;
    }
    return s;
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
      mesh.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

/* ─── Animated Torus Knot ─── */
function AnimatedTorus() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.2;
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={1}>
      <mesh ref={ref} position={[3, 0, -2]}>
        <torusKnotGeometry args={[1, 0.3, 128, 16]} />
        <MeshDistortMaterial
          color="#f97316"
          roughness={0.1}
          metalness={0.8}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

/* ─── Floating Spheres ─── */
function FloatingSpheres() {
  const spheres = useMemo(() => [
    { pos: [-4, 2, -3], scale: 0.6, color: '#f97316', speed: 1.5 },
    { pos: [4, -1, -4], scale: 0.4, color: '#ec4899', speed: 2 },
    { pos: [-2, -2, -2], scale: 0.3, color: '#8b5cf6', speed: 1.8 },
    { pos: [2, 3, -5], scale: 0.8, color: '#f97316', speed: 1.2 },
    { pos: [0, -3, -3], scale: 0.5, color: '#06b6d4', speed: 2.5 },
  ], []);

  return (
    <>
      {spheres.map((s, i) => (
        <Float key={i} speed={s.speed} rotationIntensity={1} floatIntensity={2}>
          <Sphere args={[s.scale, 32, 32]} position={s.pos}>
            <MeshDistortMaterial
              color={s.color}
              roughness={0.1}
              metalness={0.9}
              distort={0.4}
              speed={3}
              transparent
              opacity={0.5}
            />
          </Sphere>
        </Float>
      ))}
    </>
  );
}

/* ─── Morphing Blob ─── */
function MorphingBlob() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.1;
      ref.current.rotation.z = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={ref} args={[2, 64, 64]} position={[0, 0, -3]}>
        <MeshDistortMaterial
          color="#f97316"
          roughness={0.2}
          metalness={0.8}
          distort={0.5}
          speed={2}
          transparent
          opacity={0.15}
        />
      </Sphere>
    </Float>
  );
}

/* ─── Mouse-Following Light ─── */
function MouseLight() {
  const light = useRef();
  const { viewport } = useThree();

  useFrame((state) => {
    if (light.current) {
      light.current.position.x = (state.pointer.x * viewport.width) / 2;
      light.current.position.y = (state.pointer.y * viewport.height) / 2;
    }
  });

  return <pointLight ref={light} intensity={2} color="#f97316" distance={10} />;
}

/* ─── Hero 3D Scene ─── */
export function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          <MouseLight />
          <MorphingBlob />
          <FloatingSpheres />
          <AnimatedTorus />
          <Particles count={300} />
          <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ─── Product Float Scene ─── */
function FloatingCubes() {
  const group = useRef();
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const cubes = useMemo(() => [
    { pos: [-2, 1, 0], color: '#f97316', scale: 0.5 },
    { pos: [2, -1, 0], color: '#ec4899', scale: 0.4 },
    { pos: [0, 2, -1], color: '#8b5cf6', scale: 0.3 },
    { pos: [-1, -2, 1], color: '#06b6d4', scale: 0.35 },
  ], []);

  return (
    <group ref={group}>
      {cubes.map((c, i) => (
        <Float key={i} speed={1.5 + i * 0.5} rotationIntensity={2} floatIntensity={2}>
          <Box args={[c.scale, c.scale, c.scale]} position={c.pos}>
            <MeshWobbleMaterial
              color={c.color}
              roughness={0.1}
              metalness={0.8}
              factor={0.3}
              speed={2}
              transparent
              opacity={0.6}
            />
          </Box>
        </Float>
      ))}
    </group>
  );
}

export function ProductScene() {
  return (
    <div className="absolute inset-0 -z-10 opacity-30">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 3, 3]} intensity={0.5} />
          <FloatingCubes />
          <Particles count={100} color="#f97316" />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ─── Mini floating animation for CTA ─── */
export function CTAScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <Float speed={2} rotationIntensity={3} floatIntensity={2}>
            <Torus args={[1.5, 0.1, 16, 100]} position={[2, 0, 0]}>
              <meshStandardMaterial color="#f97316" roughness={0.1} metalness={0.9} transparent opacity={0.4} />
            </Torus>
          </Float>
          <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
            <Torus args={[1, 0.08, 16, 100]} position={[-2, 1, -1]} rotation={[Math.PI / 3, 0, 0]}>
              <meshStandardMaterial color="#ec4899" roughness={0.1} metalness={0.9} transparent opacity={0.3} />
            </Torus>
          </Float>
          <Particles count={80} color="#ffffff" />
          <Stars radius={30} depth={30} count={500} factor={3} saturation={0} fade speed={2} />
        </Suspense>
      </Canvas>
    </div>
  );
}

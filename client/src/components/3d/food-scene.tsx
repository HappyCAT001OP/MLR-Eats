import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Food item component with hover animation
function FoodItem({ position, scale, color, rotationSpeed, hoverAmplitude }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Rotation and floating animation
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * rotationSpeed.x;
      ref.current.rotation.y += delta * rotationSpeed.y;
      
      // Floating animation
      const time = state.clock.getElapsedTime();
      ref.current.position.y = position[1] + Math.sin(time * 2) * hoverAmplitude;
      
      // Scale animation on hover
      if (hovered && ref.current.scale.x < scale * 1.2) {
        ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, scale * 1.2, 0.1);
        ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, scale * 1.2, 0.1);
        ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, scale * 1.2, 0.1);
      } else if (!hovered && ref.current.scale.x > scale) {
        ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, scale, 0.1);
        ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, scale, 0.1);
        ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, scale, 0.1);
      }
    }
  });

  return (
    <mesh 
      ref={ref}
      position={position}
      scale={[scale, scale, scale]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.3} />
    </mesh>
  );
}

// Burger model
function Burger({ position, scale = 1, rotation = [0, 0, 0] }) {
  const group = useRef();
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group ref={group} position={position} scale={[scale, scale, scale]} rotation={rotation}>
      {/* Bun top */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.8, 16]} />
        <meshStandardMaterial color="#f4a460" roughness={1} />
      </mesh>
      
      {/* Patty */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 0.5, 16]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Cheese */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 0.2, 16]} />
        <meshStandardMaterial color="#FFD700" roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* Lettuce */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.3, 16]} />
        <meshStandardMaterial color="#7CFC00" roughness={0.8} />
      </mesh>
      
      {/* Tomato */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 0.2, 16]} />
        <meshStandardMaterial color="#FF6347" roughness={0.7} />
      </mesh>
      
      {/* Bun bottom */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[1.8, 1.5, 0.6, 16]} />
        <meshStandardMaterial color="#f4a460" roughness={1} />
      </mesh>
    </group>
  );
}

// French Fries model
function Fries({ position, scale = 1 }) {
  const group = useRef();
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.3;
    }
  });

  return (
    <group ref={group} position={position} scale={[scale, scale, scale]}>
      {/* Container */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 2, 1.2]} />
        <meshStandardMaterial color="#FF2400" roughness={0.8} />
      </mesh>
      
      {/* Fries */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 0.8, 
          0.8 + Math.random() * 0.8, 
          (Math.random() - 0.5) * 0.8
        ]} rotation={[
          Math.random() * Math.PI, 
          Math.random() * Math.PI, 
          Math.random() * Math.PI
        ]}>
          <boxGeometry args={[0.2, 1.5, 0.2]} />
          <meshStandardMaterial color="#FAFAD2" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// Soda cup model
function SodaCup({ position, scale = 1 }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <group ref={ref} position={position} scale={[scale, scale, scale]}>
      {/* Cup body */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.8, 0.6, 2, 16]} />
        <meshStandardMaterial color="#6A5ACD" roughness={0.4} />
      </mesh>
      
      {/* Straw */}
      <mesh position={[0.3, 2.2, 0]} rotation={[0, 0, Math.PI / 12]}>
        <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
        <meshStandardMaterial color="#FF1493" roughness={0.4} />
      </mesh>
      
      {/* Lid */}
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.2, 16]} />
        <meshStandardMaterial color="#4B0082" roughness={0.4} />
      </mesh>
    </group>
  );
}

// Main Scene with rotating food items
function Scene() {
  return (
    <>
      {/* Ambient light for overall scene brightness */}
      <ambientLight intensity={0.5} />
      
      {/* Directional light for highlights and shadows */}
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ffffff" />
      
      {/* Food items */}
      <Burger position={[-3, 0, 0]} scale={0.7} />
      <Fries position={[0, -0.5, 0]} scale={0.7} />
      <SodaCup position={[3, 0, 0]} scale={0.7} />
      
      {/* Animated food particles */}
      <FoodItem
        position={[-4, 3, -2]}
        scale={0.4}
        color="#FF6347" // Tomato red
        rotationSpeed={{ x: 0.01, y: 0.03 }}
        hoverAmplitude={0.1}
      />
      <FoodItem
        position={[4, 2, -1]}
        scale={0.3}
        color="#FFD700" // Gold (cheese)
        rotationSpeed={{ x: 0.02, y: -0.01 }}
        hoverAmplitude={0.15}
      />
      <FoodItem
        position={[0, 3, -3]}
        scale={0.5}
        color="#7CFC00" // Lawn green
        rotationSpeed={{ x: -0.01, y: 0.02 }}
        hoverAmplitude={0.2}
      />
      <FoodItem
        position={[3, -2, -2]}
        scale={0.35}
        color="#FF8C00" // Dark orange
        rotationSpeed={{ x: 0.03, y: 0.01 }}
        hoverAmplitude={0.12}
      />
      <FoodItem
        position={[-3, -2, -1]}
        scale={0.45}
        color="#8A2BE2" // Blue violet
        rotationSpeed={{ x: 0.01, y: -0.02 }}
        hoverAmplitude={0.18}
      />
    </>
  );
}

// Main export component
export function FoodScene({ className = '', style = {} }) {
  return (
    <div className={`${className}`} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

// Animation component for use on text or other elements
export function AnimatedText({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [delay]);
  
  return (
    <div
      className={`transition-all duration-1000 transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  );
}
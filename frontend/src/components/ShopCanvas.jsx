import { Canvas, useFrame } from '@react-three/fiber'
import {
  ContactShadows,
  Float,
  OrbitControls,
  RoundedBox,
  useGLTF,
} from '@react-three/drei'
import { Component, Suspense, useEffect, useRef, useState } from 'react'

class ModelErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Unable to load the salon 3D model; showing the preview instead.', error)
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function SalonModel() {
  const { scene } = useGLTF('/salon_shop.glb')
  return <primitive object={scene} scale={1.1} position={[0, -0.6, 0]} />
}

function FallbackSalon() {
  const groupRef = useRef(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
  })

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.8}>
        <RoundedBox args={[2.6, 2.4, 1.5]} radius={0.12} position={[0, 1.1, 0]}>
          <meshStandardMaterial color="#d9a777" metalness={0.5} roughness={0.25} />
        </RoundedBox>
      </Float>

      <mesh position={[0, -0.7, 0]} receiveShadow>
        <boxGeometry args={[4.8, 0.6, 3.7]} />
        <meshStandardMaterial color="#f1e4d7" roughness={0.85} />
      </mesh>

      <mesh position={[-1.5, 0.5, 1.2]} castShadow>
        <boxGeometry args={[0.8, 2.2, 0.6]} />
        <meshStandardMaterial color="#f8d7b8" roughness={0.8} />
      </mesh>

      <mesh position={[1.5, 0.5, 1.2]} castShadow>
        <boxGeometry args={[0.8, 2.2, 0.6]} />
        <meshStandardMaterial color="#f8d7b8" roughness={0.8} />
      </mesh>

      <mesh position={[0, 0.9, -1.1]} castShadow>
        <boxGeometry args={[2.5, 1.4, 0.6]} />
        <meshStandardMaterial color="#f4d5bf" roughness={0.7} />
      </mesh>

      <mesh position={[0, 0.2, 0.7]} castShadow>
        <boxGeometry args={[1.8, 0.35, 0.5]} />
        <meshStandardMaterial color="#b06d4b" roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  )
}

function ShopScene() {
  const [modelStatus, setModelStatus] = useState('checking')

  useEffect(() => {
    const controller = new AbortController()

    fetch('/salon_shop.glb', { method: 'HEAD', signal: controller.signal })
      .then((response) => {
        const contentType = response.headers.get('content-type') ?? ''
        const isModel = response.ok && !contentType.includes('text/html')
        setModelStatus(isModel ? 'available' : 'missing')
      })
      .catch(() => {
        if (!controller.signal.aborted) setModelStatus('missing')
      })

    return () => controller.abort()
  }, [])

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight
        position={[5, 7, 4]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-4, 5, -3]} intensity={0.9} color="#f9d7c1" />
      <spotLight position={[0, 8, 3]} angle={0.28} intensity={12} penumbra={1} />

      {modelStatus === 'available' ? (
        <ModelErrorBoundary fallback={<FallbackSalon />}>
          <Suspense fallback={<FallbackSalon />}>
            <SalonModel />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        <FallbackSalon />
      )}

      <ContactShadows position={[0, -1.3, 0]} opacity={0.7} scale={12} blur={2.4} far={8} />
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={10}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate
        autoRotateSpeed={0.8}
      />
    </>
  )
}

export default function ShopCanvas() {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0f0b12] shadow-[0_30px_80px_rgba(131,82,62,0.16)]">
      <Canvas camera={{ position: [5.5, 3.5, 7.5], fov: 38 }} shadows>
        <color attach="background" args={['#120d14']} />
        <fog attach="fog" args={['#120d14', 8, 18]} />
        <ShopScene />
      </Canvas>
    </div>
  )
}

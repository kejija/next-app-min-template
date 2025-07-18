"use client";

import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Box, Sphere, Grid } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";
import { Group, ActionIcon, Tooltip, Text } from "@mantine/core";
import {
  IconHome,
  IconZoomIn,
  IconZoomOut,
  IconSun,
  IconMoon,
} from "@tabler/icons-react";

interface R3FViewerProps {
  gltfData?: string;
  glbData?: string;
  stlData?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  selectedCommandIndex?: number | null;
  commands?: Array<{ command: string; is2D?: boolean }>;
}

// Component to load and display the model
function Model({
  gltfData,
  glbData,
  stlData,
  selectedCommandIndex,
  commands,
}: {
  gltfData?: string;
  glbData?: string;
  stlData?: string;
  selectedCommandIndex?: number | null;
  commands?: Array<{ command: string; is2D?: boolean }>;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | THREE.Mesh | null>(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      try {
        if (glbData) {
          // Load GLB data (base64 encoded)
          const loader = new GLTFLoader();
          const binaryString = atob(glbData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const gltf = await new Promise<any>((resolve, reject) => {
            loader.parse(bytes.buffer, "", resolve, reject);
          });

          console.log("R3F: GLB loaded successfully:", gltf);
          const loadedModel = gltf.scene;

          // Ensure meshes have materials
          loadedModel.traverse((child: any) => {
            if (child.isMesh) {
              if (!child.material) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x888888,
                });
              }
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          setModel(loadedModel);
        } else if (gltfData) {
          // Load GLTF data
          const loader = new GLTFLoader();
          const gltf = await new Promise<any>((resolve, reject) => {
            loader.parse(gltfData, "", resolve, reject);
          });

          const loadedModel = gltf.scene;
          loadedModel.traverse((child: any) => {
            if (child.isMesh) {
              if (!child.material) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x888888,
                });
              }
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          setModel(loadedModel);
        } else if (stlData) {
          // Load STL data (base64 encoded)
          const loader = new STLLoader();
          const binaryString = atob(stlData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const geometry = loader.parse(bytes.buffer);
          const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          setModel(mesh);
        }
      } catch (error) {
        console.error("R3F: Failed to load model:", error);
        // Create a fallback red cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const fallbackMesh = new THREE.Mesh(geometry, material);
        setModel(fallbackMesh);
      }
    };

    if (gltfData || glbData || stlData) {
      loadModel();
    } else {
      setModel(null);
    }
  }, [gltfData, glbData, stlData]);

  // Auto-center and scale the model
  useEffect(() => {
    if (model && meshRef.current) {
      // Clear previous model
      meshRef.current.clear();

      // Add new model
      meshRef.current.add(model);

      // Calculate bounding box and center/scale
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the model
      model.position.sub(center);

      // Scale to fit in view (target size of 2 units)
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scale = 2 / maxDim;
        model.scale.setScalar(scale);
      }

      console.log("R3F: Model centered and scaled:", {
        center,
        size,
        scale: model.scale.x,
      });
    }
  }, [model]);

  // Apply styling when selection or commands change
  useEffect(() => {
    if (model) {
      applyModelStyling(model);
      setNeedsUpdate(true);
    }
  }, [model, selectedCommandIndex, commands]);

  // Force re-render when needed
  useFrame(() => {
    if (needsUpdate) {
      setNeedsUpdate(false);
    }
  });

  const applyModelStyling = (model: THREE.Group | THREE.Mesh) => {
    // Check if the model contains primarily 2D shapes
    const has2DShapes = commands?.some((cmd) => cmd.is2D) || false;
    const isSelected =
      selectedCommandIndex !== null && selectedCommandIndex !== undefined;

    console.log("R3F: Applying styling", {
      has2DShapes,
      isSelected,
      commands,
      selectedCommandIndex,
    });

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Always clone the material to ensure changes are applied
        const originalMaterial = child.material as THREE.MeshStandardMaterial;
        const material = originalMaterial.clone();
        child.material = material;

        // Base styling
        if (has2DShapes) {
          // 2D shapes: lower opacity and different color
          material.transparent = true;
          material.opacity = 0.5;
          material.color.setHex(0x4dabf7); // Light blue for 2D shapes
          console.log("R3F: Applied 2D styling - transparent blue");
        } else {
          // 3D shapes: normal styling
          material.transparent = false;
          material.opacity = 1.0;
          material.color.setHex(0x888888); // Default gray
          console.log("R3F: Applied 3D styling - opaque gray");
        }

        // Selection highlighting
        if (isSelected) {
          // Add strong outline effect for selected shapes
          material.emissive.setHex(0x2563eb); // Blue emissive
          material.emissiveIntensity = 0.4;
          // Make selected items more opaque and brighter
          if (material.transparent) {
            material.opacity = Math.min(material.opacity + 0.4, 1.0);
          }
          material.color.multiplyScalar(1.2); // Brighten the color
          console.log("R3F: Applied selection highlighting");
        } else {
          material.emissive.setHex(0x000000);
          material.emissiveIntensity = 0;
        }

        // Force material update
        material.needsUpdate = true;
      }
    });
  };

  return (
    <group ref={meshRef}>{/* Model will be added here dynamically */}</group>
  );
}

// Lighting setup component
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      <directionalLight position={[0, -5, 0]} intensity={0.2} />
    </>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <Box args={[0.5, 0.5, 0.5]}>
      <meshStandardMaterial color="gray" />
    </Box>
  );
}

export default function R3FViewer({
  gltfData,
  glbData,
  stlData,
  width = 400,
  height = 400,
  backgroundColor = "#f8f9fa",
  selectedCommandIndex,
  commands,
}: R3FViewerProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const zoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(0.8);
      controlsRef.current.update();
    }
  };

  const zoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(1.25);
      controlsRef.current.update();
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const bgColor = isDarkMode ? "#2c2e33" : backgroundColor;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: bgColor,
        }}
      >
        <Canvas
          camera={{ position: [2, 2, 2], fov: 75 }}
          shadows
          style={{ background: bgColor }}
        >
          <Lighting />

          {/* Grid for reference */}
          <Grid
            args={[10, 10]}
            position={[0, -0.5, 0]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor={isDarkMode ? "#444" : "#ccc"}
            sectionSize={2.5}
            sectionThickness={1}
            sectionColor={isDarkMode ? "#666" : "#999"}
            fadeDistance={15}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={true}
          />

          <Suspense fallback={<LoadingFallback />}>
            <Model
              gltfData={gltfData}
              glbData={glbData}
              stlData={stlData}
              selectedCommandIndex={selectedCommandIndex}
              commands={commands}
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>

      {/* Controls */}
      <Group
        gap="xs"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "4px",
          borderRadius: "6px",
        }}
      >
        <Tooltip label="Reset view">
          <ActionIcon size="sm" variant="subtle" onClick={resetCamera}>
            <IconHome size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Zoom in">
          <ActionIcon size="sm" variant="subtle" onClick={zoomIn}>
            <IconZoomIn size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Zoom out">
          <ActionIcon size="sm" variant="subtle" onClick={zoomOut}>
            <IconZoomOut size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Toggle theme">
          <ActionIcon size="sm" variant="subtle" onClick={toggleDarkMode}>
            {isDarkMode ? <IconSun size={14} /> : <IconMoon size={14} />}
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Status overlay for no data */}
      {!gltfData && !glbData && !stlData && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "8px",
          }}
        >
          <Text size="sm" c="dimmed">
            No model data available
          </Text>
        </div>
      )}
    </div>
  );
}

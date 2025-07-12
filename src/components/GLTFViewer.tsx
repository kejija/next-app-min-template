"use client";

import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  Grid,
  Html,
} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  Slider,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Loader,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconRefresh,
  IconMaximize,
  IconAlertCircle,
} from "@tabler/icons-react";
import * as THREE from "three";

interface GLTFViewerProps {
  gltfUrl?: string;
  simulationData?: any[];
  width?: number;
  height?: number;
  showControls?: boolean;
  autoRotate?: boolean;
}

// Component to load and display GLTF model
function GLTFModel({
  url,
  animationIndex = 0,
}: {
  url: string;
  animationIndex?: number;
}) {
  const gltf = useGLTF(url);
  const mixer = useRef<THREE.AnimationMixer>();
  const [currentAction, setCurrentAction] = useState<THREE.AnimationAction>();

  useEffect(() => {
    if (gltf.animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(gltf.scene);
      const action = mixer.current.clipAction(gltf.animations[animationIndex]);
      action.play();
      setCurrentAction(action);
    }
  }, [gltf, animationIndex]);

  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  return <primitive object={gltf.scene} />;
}

// Fallback component for loading errors
function LoadingFallback() {
  return (
    <Html center>
      <div style={{ textAlign: "center", color: "white" }}>
        <div
          style={{
            width: "20px",
            height: "20px",
            border: "2px solid #f3f3f3",
            borderTop: "2px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 8px",
          }}
        />
        <div style={{ fontSize: "14px" }}>Loading 3D model...</div>
      </div>
    </Html>
  );
}

// Error fallback component
function ErrorFallback({ error }: { error: string }) {
  return (
    <Html center>
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Loading Error"
        color="red"
        style={{ maxWidth: 300 }}
      >
        {error}
      </Alert>
    </Html>
  );
}

export default function GLTFViewer({
  gltfUrl,
  simulationData,
  width = 800,
  height = 600,
  showControls = true,
  autoRotate = false,
}: GLTFViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [maxFrames, setMaxFrames] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (simulationData) {
      setMaxFrames(simulationData.length - 1);
    }
  }, [simulationData]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  const handleFrameChange = (frame: number) => {
    setCurrentFrame(frame);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!gltfUrl) {
    return (
      <Card withBorder p="md" style={{ width, height }}>
        <Group justify="center" align="center" h="100%">
          <Stack align="center" gap="sm">
            <IconAlertCircle size={48} color="gray" />
            <Text c="dimmed" ta="center">
              No 3D model available
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              Run a simulation to generate GLTF models
            </Text>
          </Stack>
        </Group>
      </Card>
    );
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          3D Model Viewer
        </Text>
        <Group gap="xs">
          {simulationData && (
            <Badge variant="light">{simulationData.length} frames</Badge>
          )}
          <Tooltip label="Fullscreen">
            <ActionIcon variant="light" onClick={toggleFullscreen}>
              <IconMaximize size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Card
        withBorder
        p={0}
        style={{
          width: isFullscreen ? "100vw" : width,
          height: isFullscreen ? "100vh" : height,
          position: isFullscreen ? "fixed" : "relative",
          top: isFullscreen ? 0 : "auto",
          left: isFullscreen ? 0 : "auto",
          zIndex: isFullscreen ? 1000 : "auto",
        }}
      >
        <Canvas
          camera={{ position: [5, 5, 5], fov: 50 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Environment preset="studio" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />

            {/* Grid for reference */}
            <Grid
              args={[10, 10]}
              position={[0, -1, 0]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#6f6f6f"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#9d4b4b"
              fadeDistance={25}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid={true}
            />

            {/* GLTF Model */}
            {gltfUrl && (
              <GLTFModel url={gltfUrl} animationIndex={currentFrame} />
            )}

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={autoRotate}
              autoRotateSpeed={2}
            />
          </Suspense>
        </Canvas>

        {isFullscreen && (
          <Button
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              zIndex: 1001,
            }}
            onClick={toggleFullscreen}
          >
            Exit Fullscreen
          </Button>
        )}
      </Card>

      {/* Animation Controls */}
      {showControls && simulationData && simulationData.length > 1 && (
        <Card withBorder p="md">
          <Stack gap="md">
            <Group justify="center" gap="xs">
              <Tooltip label="Reset">
                <ActionIcon variant="light" onClick={handleReset}>
                  <IconPlayerSkipBack size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={isPlaying ? "Pause" : "Play"}>
                <ActionIcon variant="filled" color="blue" onClick={handlePlay}>
                  {isPlaying ? (
                    <IconPlayerPause size={16} />
                  ) : (
                    <IconPlayerPlay size={16} />
                  )}
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Next frame">
                <ActionIcon
                  variant="light"
                  onClick={() =>
                    handleFrameChange(Math.min(currentFrame + 1, maxFrames))
                  }
                >
                  <IconPlayerSkipForward size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>

            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm">
                  Frame: {currentFrame + 1} / {maxFrames + 1}
                </Text>
                <Text size="sm" c="dimmed">
                  Time:{" "}
                  {simulationData[currentFrame]?.timestep?.toFixed(3) || 0}s
                </Text>
              </Group>

              <Slider
                value={currentFrame}
                onChange={handleFrameChange}
                min={0}
                max={maxFrames}
                step={1}
                marks={[
                  { value: 0, label: "Start" },
                  { value: maxFrames, label: "End" },
                ]}
              />
            </div>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

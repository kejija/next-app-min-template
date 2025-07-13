"use client";

import React, { useRef, useEffect, useState } from "react";
import { Group, ActionIcon, Tooltip, Text } from "@mantine/core";
import {
  IconRotate,
  IconZoomIn,
  IconZoomOut,
  IconHome,
  IconSun,
  IconMoon,
} from "@tabler/icons-react";

interface ThreeJSViewerProps {
  gltfData?: string;
  glbData?: string;
  stlData?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export default function ThreeJSViewer({
  gltfData,
  glbData,
  stlData,
  width = 400,
  height = 400,
  backgroundColor = "#f8f9fa",
}: ThreeJSViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const animationIdRef = useRef<number>();
  const threeRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Helper function to center and scale models
  const centerAndScaleModel = (model: any, THREE: any) => {
    if (!model || !THREE) {
      console.log("centerAndScaleModel: missing model or THREE");
      return;
    }

    console.log("centerAndScaleModel: starting with model:", model);

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    console.log("Bounding box:", { box, center, size });

    // Center the model
    model.position.sub(center);
    console.log("Model position after centering:", model.position);

    // Scale to fit in view
    const maxDim = Math.max(size.x, size.y, size.z);
    console.log("Max dimension:", maxDim);

    if (maxDim > 0) {
      const scale = 2 / maxDim;
      console.log("Applying scale:", scale);
      model.scale.setScalar(scale);
    }

    console.log("Final model state:", {
      position: model.position,
      scale: model.scale,
      visible: model.visible,
    });
  };

  useEffect(() => {
    let THREE: any;
    let GLTFLoader: any;
    let STLLoader: any;
    let OrbitControls: any;

    const initThreeJS = async () => {
      try {
        // Dynamically import Three.js to avoid SSR issues
        const threeModule = await import("three");
        THREE = threeModule;
        threeRef.current = THREE;

        const { GLTFLoader: GLTFLoaderClass } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );
        GLTFLoader = GLTFLoaderClass;

        const { STLLoader: STLLoaderClass } = await import(
          "three/examples/jsm/loaders/STLLoader.js"
        );
        STLLoader = STLLoaderClass;

        const { OrbitControls: OrbitControlsClass } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );
        OrbitControls = OrbitControlsClass;

        setupScene();
      } catch (err) {
        console.error("Failed to load Three.js:", err);
        setError("Failed to load 3D viewer");
        setIsLoading(false);
      }
    };

    const setupScene = () => {
      if (!mountRef.current || !THREE) return;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(isDarkMode ? 0x2c2e33 : 0xf8f9fa);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(2, 2, 2);
      camera.lookAt(0, 0, 0); // Make sure camera is looking at origin
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Lighting
      setupLighting(scene);

      // Clear any existing content and add renderer to DOM
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(renderer.domElement);

      // Load model
      loadModel();

      // Start animation loop
      animate();
    };

    const setupLighting = (scene: any) => {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);

      // Directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Additional lights for better visibility
      const light1 = new THREE.DirectionalLight(0xffffff, 0.3);
      light1.position.set(-5, 5, -5);
      scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xffffff, 0.2);
      light2.position.set(0, -5, 0);
      scene.add(light2);
    };

    const loadModel = async () => {
      if (!sceneRef.current || !THREE) return;

      try {
        setIsLoading(true);
        setError(null);

        // Remove existing model
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
          modelRef.current = null;
        }

        if (gltfData) {
          // Load GLTF data
          const loader = new GLTFLoader();
          const gltf = await new Promise((resolve, reject) => {
            loader.parse(gltfData, "", resolve, reject);
          });

          const model = gltf.scene;
          modelRef.current = model;
          sceneRef.current.add(model);

          // Center and scale model
          centerAndScaleModel(model, THREE);
        } else if (glbData) {
          // Load GLB data (base64 encoded)
          const loader = new GLTFLoader();
          const binaryString = atob(glbData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const gltf = await new Promise((resolve, reject) => {
            loader.parse(bytes.buffer, "", resolve, reject);
          });

          const model = gltf.scene;
          modelRef.current = model;
          sceneRef.current.add(model);

          // Center and scale model
          centerAndScaleModel(model, THREE);
        } else if (stlData) {
          // Load STL data (base64 encoded)
          const loader = new STLLoader();
          const binaryString = atob(stlData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const geometry = loader.parse(bytes.buffer);
          const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
          const model = new THREE.Mesh(geometry, material);
          model.castShadow = true;
          model.receiveShadow = true;

          modelRef.current = model;
          sceneRef.current.add(model);

          // Center and scale model
          centerAndScaleModel(model, THREE);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load model:", err);
        setError("Failed to load 3D model");
        setIsLoading(false);
      }
    };

    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current)
        return;

      animationIdRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    initThreeJS();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (mountRef.current) {
        // Clear all content to remove any canvas elements
        mountRef.current.innerHTML = "";
      }
      // Reset refs
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      modelRef.current = null;
      threeRef.current = null;
    };
  }, [width, height, isDarkMode]);

  // Reload model when data changes
  useEffect(() => {
    console.log("ThreeJSViewer data changed:", {
      gltfData: !!gltfData,
      glbData: !!glbData,
      stlData: !!stlData,
      sceneReady: !!sceneRef.current,
      threeReady: !!threeRef.current,
    });

    if (
      sceneRef.current &&
      threeRef.current &&
      (gltfData || glbData || stlData)
    ) {
      // The loadModel function is already defined in the main useEffect above
      // Just trigger a reload by calling the existing loadModel function
      const existingLoadModel = async () => {
        if (!sceneRef.current || !threeRef.current) return;

        const THREE = threeRef.current;

        try {
          setIsLoading(true);
          setError(null);

          // Remove existing model
          if (modelRef.current) {
            sceneRef.current.remove(modelRef.current);
            modelRef.current = null;
          }

          if (gltfData) {
            // Load GLTF data
            const GLTFLoader = (
              await import("three/examples/jsm/loaders/GLTFLoader.js")
            ).GLTFLoader;
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
              loader.parse(gltfData, "", resolve, reject);
            });

            const model = gltf.scene;
            modelRef.current = model;
            sceneRef.current.add(model);

            // Center and scale model
            centerAndScaleModel(model, THREE);
          } else if (glbData) {
            // Load GLB data (base64 encoded)
            const GLTFLoader = (
              await import("three/examples/jsm/loaders/GLTFLoader.js")
            ).GLTFLoader;
            const loader = new GLTFLoader();
            const binaryString = atob(glbData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const gltf = await new Promise((resolve, reject) => {
              loader.parse(bytes.buffer, "", resolve, reject);
            });

            const model = gltf.scene;
            modelRef.current = model;
            sceneRef.current.add(model);

            // Center and scale model
            centerAndScaleModel(model, THREE);
          } else if (stlData) {
            // Load STL data (base64 encoded)
            const STLLoader = (
              await import("three/examples/jsm/loaders/STLLoader.js")
            ).STLLoader;
            const loader = new STLLoader();
            const binaryString = atob(stlData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const geometry = loader.parse(bytes.buffer);
            const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
            const model = new THREE.Mesh(geometry, material);
            model.castShadow = true;
            model.receiveShadow = true;

            modelRef.current = model;
            sceneRef.current.add(model);

            // Center and scale model
            centerAndScaleModel(model, THREE);
          }

          setIsLoading(false);
        } catch (err) {
          console.error("Failed to load model:", err);
          setError("Failed to load 3D model");
          setIsLoading(false);
        }
      };

      existingLoadModel();
    }
  }, [gltfData, glbData, stlData]);

  // Also trigger model loading when scene becomes ready (if data is already available)
  useEffect(() => {
    console.log("ThreeJSViewer scene ready check:", {
      sceneReady: !!sceneRef.current,
      threeReady: !!threeRef.current,
      hasData: !!(gltfData || glbData || stlData),
    });

    if (
      sceneRef.current &&
      threeRef.current &&
      (gltfData || glbData || stlData)
    ) {
      console.log("Scene is ready and data is available, loading model...");
      // Trigger the same model loading logic
      const loadModelWhenReady = async () => {
        if (!sceneRef.current || !threeRef.current) return;

        const THREE = threeRef.current;

        try {
          setIsLoading(true);
          setError(null);

          // Remove existing model
          if (modelRef.current) {
            sceneRef.current.remove(modelRef.current);
            modelRef.current = null;
          }

          if (gltfData) {
            // Load GLTF data
            const GLTFLoader = (
              await import("three/examples/jsm/loaders/GLTFLoader.js")
            ).GLTFLoader;
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
              loader.parse(gltfData, "", resolve, reject);
            });

            const model = gltf.scene;
            modelRef.current = model;
            sceneRef.current.add(model);

            // Center and scale model
            centerAndScaleModel(model, THREE);
          } else if (glbData) {
            // Load GLB data (base64 encoded)
            const GLTFLoader = (
              await import("three/examples/jsm/loaders/GLTFLoader.js")
            ).GLTFLoader;
            const loader = new GLTFLoader();
            const binaryString = atob(glbData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const gltf = await new Promise((resolve, reject) => {
              loader.parse(bytes.buffer, "", resolve, reject);
            });

            console.log("GLB loaded successfully:", gltf);
            const model = gltf.scene;
            console.log("Model scene:", model);
            console.log("Model children:", model.children);
            console.log("Model position:", model.position);
            console.log("Model scale:", model.scale);

            // Debug: check model contents
            console.log("Model children count:", model.children.length);
            console.log("Model children details:", model.children);

            // Check if model has any meshes
            let meshCount = 0;
            model.traverse((child: any) => {
              console.log("Traversing child:", child.type, child.name);
              if (child.isMesh) {
                meshCount++;
                console.log("Found mesh:", child);
                console.log("Mesh geometry:", child.geometry);
                console.log("Mesh material:", child.material);
                console.log("Mesh visible:", child.visible);

                // Force a visible material
                if (!child.material) {
                  child.material = new THREE.MeshLambertMaterial({
                    color: 0xff0000, // Red for debugging
                  });
                  console.log("Added red material to mesh");
                } else {
                  // Make existing material more visible
                  if (child.material.color) {
                    child.material.color.setHex(0x00ff00); // Green for debugging
                  }
                  child.material.needsUpdate = true;
                  console.log("Updated material to green");
                }

                child.castShadow = true;
                child.receiveShadow = true;
                child.visible = true;
              }
            });

            console.log("Total meshes found:", meshCount);

            // If no meshes found, create a simple test cube
            if (meshCount === 0) {
              console.log("No meshes found, creating test cube");
              const geometry = new THREE.BoxGeometry(1, 1, 1);
              const material = new THREE.MeshLambertMaterial({
                color: 0xff0000,
              });
              const testCube = new THREE.Mesh(geometry, material);
              model.add(testCube);
              console.log("Added test cube to model");
            }

            modelRef.current = model;
            sceneRef.current.add(model);
            console.log("Model added to scene");

            // Center and scale model
            centerAndScaleModel(model, THREE);
            console.log("Model after centering/scaling:", {
              position: model.position,
              scale: model.scale,
              visible: model.visible,
            });
          } else if (stlData) {
            // Load STL data (base64 encoded)
            const STLLoader = (
              await import("three/examples/jsm/loaders/STLLoader.js")
            ).STLLoader;
            const loader = new STLLoader();
            const binaryString = atob(stlData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const geometry = loader.parse(bytes.buffer);
            const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
            const model = new THREE.Mesh(geometry, material);
            model.castShadow = true;
            model.receiveShadow = true;

            modelRef.current = model;
            sceneRef.current.add(model);

            // Center and scale model
            centerAndScaleModel(model, THREE);
          }

          setIsLoading(false);
        } catch (err) {
          console.error("Failed to load model:", err);
          setError("Failed to load 3D model");
          setIsLoading(false);
        }
      };

      loadModelWhenReady();
    }
  }, [sceneRef.current, threeRef.current]); // Trigger when scene/three becomes ready

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(2, 2, 2);
      controlsRef.current.reset();
    }
  };

  const zoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(0.8);
    }
  };

  const zoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(1.25);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (sceneRef.current) {
      sceneRef.current.background.setHex(isDarkMode ? 0xf8f9fa : 0x2c2e33);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mountRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor,
        }}
      />

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

      {/* Status overlay */}
      {(isLoading || error) && (
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
          {isLoading ? (
            <Text>Loading 3D model...</Text>
          ) : error ? (
            <Text c="red">{error}</Text>
          ) : null}
        </div>
      )}
    </div>
  );
}

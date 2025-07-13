import axios from "axios";
import { create } from "zustand";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Types
export interface Example {
  filename: string;
  path: string;
  project_name: string;
  components: number;
  simulation_time: number;
  description: string;
}

export interface SimulationStatus {
  status: "running" | "completed" | "failed" | "error";
  started_at: string;
  completed_at?: string;
  progress: number;
  message: string;
}

export interface SimulationResult {
  simulation_id: string;
  status: SimulationStatus;
  files: Array<{
    name: string;
    path: string;
    size: number;
    type: string;
  }>;
}

export interface Component {
  filename: string;
  path: string;
  name: string;
  description: string;
  material: string;
  cad_commands: number;
  created_at: string;
}

export interface CADCommand {
  command: string;
  params: Record<string, any>;
  hidden?: boolean;
}

export interface ComponentContent {
  name: string;
  description?: string;
  material?: string;
  density?: number;
  color?: [number, number, number];
  cad_commands: CADCommand[];
  collision?: {
    enabled: boolean;
    shape: string;
    params: Record<string, any>;
  };
}

export interface SimulationData {
  timestep: number;
  positions: Record<string, number[]>;
  orientations: Record<string, number[]>;
  velocities?: Record<string, number[]>;
  forces?: Record<string, number[]>;
}

export interface CustomSimulation {
  filename: string;
  path: string;
  project_name: string;
  components: number;
  simulation_time: number;
  description: string;
  created_at: string;
}

interface StoreState {
  // Examples
  examples: Example[];
  selectedExample: Example | null;
  exampleContent: any | null;

  // Custom Simulations
  customSimulations: CustomSimulation[];
  selectedCustomSimulation: CustomSimulation | null;
  customSimulationContent: any | null;

  // Components
  components: Component[];
  selectedComponent: Component | null;
  componentContent: ComponentContent | null;

  // Simulations
  simulations: Record<string, SimulationStatus>;
  currentSimulation: string | null;
  simulationResults: Record<string, SimulationResult>;
  simulationData: SimulationData[] | null;

  // UI State
  loading: boolean;
  error: string | null;

  // Actions
  fetchExamples: () => Promise<void>;
  selectExample: (example: Example) => void;
  fetchExampleContent: (filename: string) => Promise<void>;

  // Component Actions
  fetchComponents: () => Promise<void>;
  selectComponent: (component: Component) => void;
  fetchComponentContent: (filename: string) => Promise<void>;
  saveComponent: (
    filename: string,
    content: ComponentContent,
    overwrite?: boolean
  ) => Promise<boolean>;
  deleteComponent: (filename: string) => Promise<boolean>;
  generateComponentPreview: (
    cad_commands: CADCommand[],
    color?: [number, number, number]
  ) => Promise<string | null>;

  // Custom Simulations
  fetchCustomSimulations: () => Promise<void>;
  selectCustomSimulation: (customSimulation: CustomSimulation) => void;
  fetchCustomSimulationContent: (filename: string) => Promise<void>;
  saveCustomSimulation: (
    filename: string,
    content: any,
    overwrite?: boolean
  ) => Promise<boolean>;
  deleteCustomSimulation: (filename: string) => Promise<boolean>;
  copyExampleToCustom: (
    exampleFilename: string,
    newFilename: string
  ) => Promise<any>;

  // Simulations
  startSimulation: (config: {
    source_type: string;
    filename?: string;
    json_data?: any;
  }) => Promise<string | null>;
  fetchSimulationStatus: (simulationId: string) => Promise<void>;
  fetchSimulationResults: (simulationId: string) => Promise<void>;
  fetchAllSimulations: () => Promise<void>;
  deleteSimulation: (simulationId: string) => Promise<boolean>;
  clearError: () => void;
}

const useStore = create<StoreState>((set, get) => ({
  // Initial state
  examples: [],
  selectedExample: null,
  exampleContent: null,
  customSimulations: [],
  selectedCustomSimulation: null,
  customSimulationContent: null,
  components: [],
  selectedComponent: null,
  componentContent: null,
  simulations: {},
  currentSimulation: null,
  simulationResults: {},
  simulationData: null,
  loading: false,
  error: null,

  // Actions
  fetchExamples: async () => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.get("/examples");
      set({ examples: data.examples || [], loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch examples",
        loading: false,
      });
    }
  },

  selectExample: (example: Example) => {
    set({ selectedExample: example });
  },

  // Custom Simulations
  fetchCustomSimulations: async () => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.get("/custom-simulations");
      set({ customSimulations: data.custom_simulations || [], loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch custom simulations",
        loading: false,
      });
    }
  },

  selectCustomSimulation: (customSimulation: CustomSimulation) => {
    set({ selectedCustomSimulation: customSimulation });
  },

  fetchCustomSimulationContent: async (filename: string) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.get(`/custom-simulations/${filename}`);
      set({ customSimulationContent: data.content, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch custom simulation content",
        loading: false,
      });
    }
  },

  saveCustomSimulation: async (
    filename: string,
    content: any,
    overwrite = false
  ) => {
    try {
      set({ loading: true, error: null });
      await api.post("/custom-simulations", {
        filename,
        content,
        overwrite,
      });
      set({ loading: false });
      // Refresh custom simulations list
      get().fetchCustomSimulations();
      return true;
    } catch (error: any) {
      set({
        error: error.message || "Failed to save custom simulation",
        loading: false,
      });
      return false;
    }
  },

  deleteCustomSimulation: async (filename: string) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/custom-simulations/${filename}`);
      set({ loading: false });
      // Refresh custom simulations list
      get().fetchCustomSimulations();
      return true;
    } catch (error: any) {
      set({
        error: error.message || "Failed to delete custom simulation",
        loading: false,
      });
      return false;
    }
  },

  copyExampleToCustom: async (exampleFilename: string, newFilename: string) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.post(`/examples/${exampleFilename}/copy`, {
        new_filename: newFilename,
      });
      set({ loading: false });
      // Refresh custom simulations list
      get().fetchCustomSimulations();
      return data.content;
    } catch (error: any) {
      set({
        error: error.message || "Failed to copy example",
        loading: false,
      });
      return null;
    }
  },

  fetchExampleContent: async (filename: string) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.get(`/examples/${filename}`);
      set({ exampleContent: data.content, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch example content",
        loading: false,
      });
    }
  },

  // Component Actions
  fetchComponents: async () => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.get("/components");
      set({ components: data.components || [], loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch components",
        loading: false,
      });
    }
  },

  selectComponent: (component: Component) => {
    set({ selectedComponent: component });
  },

  fetchComponentContent: async (filename: string) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.get(`/components/${filename}`);
      set({ componentContent: data.content, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch component content",
        loading: false,
      });
    }
  },

  saveComponent: async (
    filename: string,
    content: ComponentContent,
    overwrite = false
  ) => {
    try {
      set({ loading: true, error: null });
      await api.post("/components", {
        filename,
        content,
        overwrite,
      });
      set({ loading: false });
      // Refresh components list
      get().fetchComponents();
      return true;
    } catch (error: any) {
      set({
        error: error.message || "Failed to save component",
        loading: false,
      });
      return false;
    }
  },

  deleteComponent: async (filename: string) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/components/${filename}`);
      set({ loading: false });
      // Refresh components list
      get().fetchComponents();
      return true;
    } catch (error: any) {
      set({
        error: error.message || "Failed to delete component",
        loading: false,
      });
      return false;
    }
  },

  generateComponentPreview: async (
    cad_commands: CADCommand[],
    color?: [number, number, number]
  ) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.post("/components/preview", {
        cad_commands,
        color: color || [0.7, 0.7, 0.7],
      });
      set({ loading: false });

      if (data.success) {
        return {
          data: data.gltf || data.glb_base64 || data.stl_base64,
          format:
            data.format ||
            (data.gltf ? "gltf" : data.glb_base64 ? "glb" : "stl"),
        };
      } else {
        throw new Error(data.error || "Preview generation failed");
      }
    } catch (error: any) {
      set({
        error: error.message || "Failed to generate component preview",
        loading: false,
      });
      return null;
    }
  },

  startSimulation: async (config) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.post("/simulate", config);

      if (data.success) {
        const simulationId = data.simulation_id;
        set({
          currentSimulation: simulationId,
          simulations: {
            ...get().simulations,
            [simulationId]: {
              status: "running",
              started_at: new Date().toISOString(),
              progress: 0,
              message: "Simulation started",
            },
          },
          loading: false,
        });
        return simulationId;
      } else {
        throw new Error(data.error || "Failed to start simulation");
      }
    } catch (error: any) {
      set({
        error: error.message || "Failed to start simulation",
        loading: false,
      });
      return null;
    }
  },

  fetchSimulationStatus: async (simulationId: string) => {
    try {
      const { data } = await api.get(`/simulations/${simulationId}/status`);
      if (data.success) {
        set({
          simulations: {
            ...get().simulations,
            [simulationId]: data.status,
          },
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch simulation status:", error);
    }
  },

  fetchSimulationResults: async (simulationId: string) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.get(`/simulations/${simulationId}/results`);

      if (data.success) {
        set({
          simulationResults: {
            ...get().simulationResults,
            [simulationId]: data,
          },
          loading: false,
        });

        // Try to fetch simulation data JSON if available
        const jsonFile = data.files.find(
          (f: any) => f.name === "simulation_data.json"
        );
        if (jsonFile) {
          try {
            const jsonData = await api.get(
              `/simulations/${simulationId}/download/${jsonFile.path}`
            );
            set({ simulationData: jsonData.data.timesteps || null });
          } catch (error) {
            console.error("Failed to fetch simulation data:", error);
          }
        }
      } else {
        throw new Error(data.error || "Failed to fetch results");
      }
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch simulation results",
        loading: false,
      });
    }
  },

  fetchAllSimulations: async () => {
    try {
      const { data } = await api.get("/simulations");
      if (data.success) {
        set({ simulations: data.simulations });
      }
    } catch (error: any) {
      console.error("Failed to fetch simulations:", error);
    }
  },

  deleteSimulation: async (simulationId: string) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/simulations/${simulationId}`);

      // Remove from local state
      const { simulations, simulationResults } = get();
      const newSimulations = { ...simulations };
      const newResults = { ...simulationResults };

      delete newSimulations[simulationId];
      delete newResults[simulationId];

      set({
        simulations: newSimulations,
        simulationResults: newResults,
        currentSimulation:
          get().currentSimulation === simulationId
            ? null
            : get().currentSimulation,
        loading: false,
      });

      return true;
    } catch (error: any) {
      set({
        error: error.message || "Failed to delete simulation",
        loading: false,
      });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useStore;

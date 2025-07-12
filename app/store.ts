import axios from "axios";
import { create } from "zustand";

const API_URL = "http://localhost:5001/api";

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

export interface SimulationData {
  timestep: number;
  positions: Record<string, number[]>;
  orientations: Record<string, number[]>;
  velocities?: Record<string, number[]>;
  forces?: Record<string, number[]>;
}

interface StoreState {
  // Examples
  examples: Example[];
  selectedExample: Example | null;
  exampleContent: any | null;

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
  startSimulation: (config: {
    source_type: string;
    filename?: string;
    json_data?: any;
  }) => Promise<string | null>;
  fetchSimulationStatus: (simulationId: string) => Promise<void>;
  fetchSimulationResults: (simulationId: string) => Promise<void>;
  fetchAllSimulations: () => Promise<void>;
  clearError: () => void;
}

const useStore = create<StoreState>((set, get) => ({
  // Initial state
  examples: [],
  selectedExample: null,
  exampleContent: null,
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

  clearError: () => {
    set({ error: null });
  },
}));

export default useStore;

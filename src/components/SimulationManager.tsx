"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  Progress,
  Badge,
  ScrollArea,
  Modal,
  Tabs,
  Alert,
  ActionIcon,
  Tooltip,
  Grid,
} from "@mantine/core";
import {
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconDownload,
  IconEye,
  IconAlertCircle,
  IconPlayerPlay,
  IconTrash,
} from "@tabler/icons-react";
import useStore, { Example, SimulationStatus } from "../../app/store";
import GLTFViewer from "./GLTFViewer";
import ResultsCharts from "./ResultsCharts";

interface SimulationManagerProps {
  selectedExample?: Example | null;
}

export default function SimulationManager({
  selectedExample,
}: SimulationManagerProps) {
  const {
    simulations,
    currentSimulation,
    simulationResults,
    simulationData,
    loading,
    error,
    startSimulation,
    fetchSimulationStatus,
    fetchSimulationResults,
    fetchAllSimulations,
    deleteSimulation,
    clearError,
  } = useStore();

  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedSimulationId, setSelectedSimulationId] = useState<
    string | null
  >(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [simulationToDelete, setSimulationToDelete] = useState<string | null>(
    null
  );

  // Poll for simulation status updates
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(simulations).forEach((id) => {
        const sim = simulations[id];
        if (sim.status === "running") {
          fetchSimulationStatus(id);
        }
      });
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [simulations, fetchSimulationStatus]);

  // Fetch all simulations on mount
  useEffect(() => {
    fetchAllSimulations();
  }, [fetchAllSimulations]);

  const handleRunSimulation = async () => {
    if (!selectedExample) return;

    const simulationId = await startSimulation({
      source_type: "example",
      filename: selectedExample.filename,
    });

    if (simulationId) {
      // Start polling for this simulation
      const pollInterval = setInterval(async () => {
        await fetchSimulationStatus(simulationId);
        const status = simulations[simulationId];

        if (
          status &&
          (status.status === "completed" ||
            status.status === "failed" ||
            status.status === "error")
        ) {
          clearInterval(pollInterval);
          if (status.status === "completed") {
            await fetchSimulationResults(simulationId);
          }
        }
      }, 1000);
    }
  };

  const handleViewResults = async (simulationId: string) => {
    setSelectedSimulationId(simulationId);
    await fetchSimulationResults(simulationId);
    setResultsModalOpen(true);
  };

  const handleDeleteSimulation = (simulationId: string) => {
    setSimulationToDelete(simulationId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSimulation = async () => {
    if (simulationToDelete) {
      const success = await deleteSimulation(simulationToDelete);
      if (success) {
        setDeleteConfirmOpen(false);
        setSimulationToDelete(null);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "blue";
      case "completed":
        return "green";
      case "failed":
        return "red";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <IconClock size={16} />;
      case "completed":
        return <IconCheck size={16} />;
      case "failed":
        return <IconX size={16} />;
      case "error":
        return <IconX size={16} />;
      default:
        return <IconClock size={16} />;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);

    if (duration < 60) return `${duration}s`;
    if (duration < 3600)
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor(
      (duration % 3600) / 60
    )}m`;
  };

  const currentSimulationResults = selectedSimulationId
    ? simulationResults[selectedSimulationId]
    : null;
  const gltfFile = currentSimulationResults?.files.find((f) =>
    f.name.endsWith(".gltf")
  );
  const gltfUrl = gltfFile
    ? `http://localhost:5000/api/simulations/${selectedSimulationId}/download/${gltfFile.path}`
    : undefined;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          Simulation Manager
        </Text>
        <Tooltip label="Refresh simulations">
          <ActionIcon variant="light" onClick={fetchAllSimulations}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          onClose={clearError}
          withCloseButton
        >
          {error}
        </Alert>
      )}

      {/* Run New Simulation */}
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={500}>Run New Simulation</Text>

          {selectedExample ? (
            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>
                  {selectedExample.project_name}
                </Text>
                <Text size="xs" c="dimmed">
                  {selectedExample.filename}
                </Text>
                <Group gap="xs" mt="xs">
                  <Badge size="xs" variant="light">
                    {selectedExample.components} components
                  </Badge>
                  <Badge size="xs" variant="light">
                    {selectedExample.simulation_time}s
                  </Badge>
                </Group>
              </div>

              <Button
                leftSection={<IconPlayerPlay size={16} />}
                onClick={handleRunSimulation}
                loading={loading}
                disabled={!selectedExample}
              >
                Run Simulation
              </Button>
            </Group>
          ) : (
            <Alert color="blue" variant="light">
              Select an example from the Examples panel to run a simulation
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Active/Recent Simulations */}
      <Card withBorder p="md">
        <Text fw={500} mb="md">
          Simulations
        </Text>

        <ScrollArea h={300}>
          <Stack gap="sm">
            {Object.entries(simulations).length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No simulations yet
              </Text>
            ) : (
              Object.entries(simulations)
                .sort(
                  ([, a], [, b]) =>
                    new Date(b.started_at).getTime() -
                    new Date(a.started_at).getTime()
                )
                .map(([id, simulation]) => (
                  <Card key={id} withBorder p="sm" radius="sm">
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <Badge
                            size="sm"
                            color={getStatusColor(simulation.status)}
                            leftSection={getStatusIcon(simulation.status)}
                          >
                            {simulation.status}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            ID: {id.slice(0, 8)}...
                          </Text>
                        </Group>

                        <Text size="sm" mb="xs">
                          {simulation.message}
                        </Text>

                        {simulation.status === "running" && (
                          <Progress
                            value={simulation.progress}
                            size="sm"
                            mb="xs"
                            animated
                          />
                        )}

                        <Text size="xs" c="dimmed">
                          Started:{" "}
                          {new Date(simulation.started_at).toLocaleString()}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Duration:{" "}
                          {formatDuration(
                            simulation.started_at,
                            simulation.completed_at
                          )}
                        </Text>
                      </div>

                      <Group gap="xs">
                        {simulation.status === "completed" && (
                          <Tooltip label="View results">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleViewResults(id)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="Delete simulation">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteSimulation(id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Card>
                ))
            )}
          </Stack>
        </ScrollArea>
      </Card>

      {/* Results Modal */}
      <Modal
        opened={resultsModalOpen}
        onClose={() => setResultsModalOpen(false)}
        title={
          <Group>
            <Text fw={600}>Simulation Results</Text>
            {selectedSimulationId && (
              <Badge variant="light">
                {selectedSimulationId.slice(0, 8)}...
              </Badge>
            )}
          </Group>
        }
        size="xl"
        fullScreen
      >
        {currentSimulationResults && (
          <Tabs defaultValue="3d">
            <Tabs.List>
              <Tabs.Tab value="3d">3D Viewer</Tabs.Tab>
              <Tabs.Tab value="charts">Charts</Tabs.Tab>
              <Tabs.Tab value="files">Files</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="3d" pt="md">
              <GLTFViewer
                gltfUrl={gltfUrl}
                simulationData={simulationData}
                width={800}
                height={600}
                showControls={true}
              />
            </Tabs.Panel>

            <Tabs.Panel value="charts" pt="md">
              <ResultsCharts
                simulationData={simulationData}
                simulationId={selectedSimulationId || undefined}
              />
            </Tabs.Panel>

            <Tabs.Panel value="files" pt="md">
              <Stack gap="sm">
                <Text fw={500}>Generated Files</Text>
                <Grid>
                  {currentSimulationResults.files.map((file, index) => (
                    <Grid.Col key={index} span={6}>
                      <Card withBorder p="sm">
                        <Group justify="space-between">
                          <div>
                            <Text size="sm" fw={500}>
                              {file.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {(file.size / 1024).toFixed(1)} KB • {file.type}
                            </Text>
                          </div>
                          <ActionIcon
                            variant="light"
                            component="a"
                            href={`http://localhost:5000/api/simulations/${selectedSimulationId}/download/${file.path}`}
                            target="_blank"
                          >
                            <IconDownload size={16} />
                          </ActionIcon>
                        </Group>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Simulation"
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete this simulation? This action cannot
            be undone. All simulation files and results will be permanently
            removed.
          </Text>

          {simulationToDelete && (
            <Text size="sm" c="dimmed">
              Simulation ID: {simulationToDelete.slice(0, 8)}...
            </Text>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmDeleteSimulation}
              loading={loading}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

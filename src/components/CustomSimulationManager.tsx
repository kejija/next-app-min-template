"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  ScrollArea,
  Modal,
  TextInput,
  Alert,
  ActionIcon,
  Tooltip,
  Grid,
  Tabs,
  Select,
  NumberInput,
  Textarea,
  JsonInput,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCopy,
  IconPlayerPlay,
  IconAlertCircle,
  IconRefresh,
  IconDownload,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";

// Dynamically import ReactJsonView to avoid SSR issues
const ReactJsonView = dynamic(() => import("react-json-view"), {
  ssr: false,
  loading: () => <div>Loading JSON editor...</div>,
});

import useStore, { CustomSimulation, Example } from "../../app/store";

export default function CustomSimulationManager() {
  const {
    customSimulations,
    selectedCustomSimulation,
    customSimulationContent,
    examples,
    loading,
    error,
    fetchCustomSimulations,
    selectCustomSimulation,
    fetchCustomSimulationContent,
    saveCustomSimulation,
    deleteCustomSimulation,
    copyExampleToCustom,
    fetchExamples,
    startSimulation,
    clearError,
  } = useStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [simulationToDelete, setSimulationToDelete] = useState<string | null>(
    null
  );

  const [newSimulationName, setNewSimulationName] = useState("");
  const [selectedExample, setSelectedExample] = useState<string>("");
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editingFilename, setEditingFilename] = useState("");

  useEffect(() => {
    fetchCustomSimulations();
    fetchExamples();
  }, []);

  const handleCreateNew = () => {
    setNewSimulationName("");
    setCreateModalOpen(true);
  };

  const handleCopyExample = () => {
    setSelectedExample("");
    setCopyModalOpen(true);
  };

  const handleEdit = (customSim: CustomSimulation) => {
    selectCustomSimulation(customSim);
    fetchCustomSimulationContent(customSim.filename);
    setEditingFilename(customSim.filename);
    setEditModalOpen(true);
  };

  const handleDelete = (filename: string) => {
    setSimulationToDelete(filename);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (simulationToDelete) {
      const success = await deleteCustomSimulation(simulationToDelete);
      if (success) {
        setDeleteConfirmOpen(false);
        setSimulationToDelete(null);
      }
    }
  };

  const handleSaveNew = async () => {
    if (!newSimulationName.trim()) return;

    const defaultContent = {
      $schema: "../schema/input.schema.json",
      project_name: newSimulationName,
      export: {
        generate_stl: true,
        step_interval: 0.02,
        timestamps: [0.0, 0.5, 1.0],
      },
      units: {
        length: "meters",
        mass: "kilograms",
        time: "seconds",
        force: "newtons",
      },
      environment: {
        gravity: [0, 0, -9.81],
        temperature: 293.15,
        air_pressure: 101325,
        simulation_time: 1.0,
        timestep: 0.02,
      },
      loads: [],
      joints: [],
      components: [],
    };

    const success = await saveCustomSimulation(
      newSimulationName.replace(/\s+/g, "_").toLowerCase(),
      defaultContent
    );

    if (success) {
      setCreateModalOpen(false);
      setNewSimulationName("");
    }
  };

  const handleCopyExampleSubmit = async () => {
    if (!selectedExample || !newSimulationName.trim()) return;

    const success = await copyExampleToCustom(
      selectedExample,
      newSimulationName.replace(/\s+/g, "_").toLowerCase()
    );

    if (success) {
      setCopyModalOpen(false);
      setSelectedExample("");
      setNewSimulationName("");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingContent || !editingFilename) return;

    const success = await saveCustomSimulation(
      editingFilename,
      editingContent,
      true // overwrite
    );

    if (success) {
      setEditModalOpen(false);
      setEditingContent(null);
      setEditingFilename("");
    }
  };

  const handleRunCustomSimulation = async (filename: string) => {
    const simulationId = await startSimulation({
      source_type: "custom",
      filename: filename,
    });

    if (simulationId) {
      // Could switch to simulations tab or show notification
      console.log("Started custom simulation:", simulationId);
    }
  };

  // Update editing content when custom simulation content is loaded
  useEffect(() => {
    if (customSimulationContent && editModalOpen) {
      setEditingContent(customSimulationContent);
    }
  }, [customSimulationContent, editModalOpen]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={600}>
            Custom Simulations
          </Text>
          <Text size="sm" c="dimmed">
            Create, edit, and manage your custom simulation configurations
          </Text>
        </div>

        <Group gap="sm">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateNew}
          >
            Create New
          </Button>
          <Button
            variant="light"
            leftSection={<IconCopy size={16} />}
            onClick={handleCopyExample}
          >
            Copy Example
          </Button>
          <ActionIcon
            variant="light"
            onClick={fetchCustomSimulations}
            loading={loading}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
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

      {/* Custom Simulations List */}
      <Card withBorder p="md">
        <Text fw={500} mb="md">
          Your Custom Simulations ({customSimulations.length})
        </Text>

        <ScrollArea h={400}>
          <Stack gap="sm">
            {customSimulations.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No custom simulations yet. Create one to get started!
              </Text>
            ) : (
              customSimulations.map((customSim) => (
                <Card key={customSim.filename} withBorder p="sm" radius="sm">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Text fw={500}>{customSim.project_name}</Text>
                        <Badge size="sm" variant="light">
                          {customSim.components} components
                        </Badge>
                        <Badge size="sm" variant="light">
                          {customSim.simulation_time}s
                        </Badge>
                      </Group>

                      <Text size="sm" c="dimmed" mb="xs">
                        {customSim.filename}
                      </Text>

                      <Text size="xs" c="dimmed">
                        Created:{" "}
                        {new Date(customSim.created_at).toLocaleString()}
                      </Text>
                    </div>

                    <Group gap="xs">
                      <Tooltip label="Run simulation">
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() =>
                            handleRunCustomSimulation(customSim.filename)
                          }
                        >
                          <IconPlayerPlay size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleEdit(customSim)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(customSim.filename)}
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

      {/* Create New Simulation Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Custom Simulation"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Simulation Name"
            placeholder="Enter simulation name"
            value={newSimulationName}
            onChange={(e) => setNewSimulationName(e.target.value)}
            required
          />

          <Text size="sm" c="dimmed">
            A basic simulation template will be created with default settings.
            You can edit it after creation to add components, loads, and other
            parameters.
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNew}
              loading={loading}
              disabled={!newSimulationName.trim()}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Copy Example Modal */}
      <Modal
        opened={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        title="Copy Example to Custom Simulation"
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Select Example"
            placeholder="Choose an example to copy"
            data={examples.map((ex) => ({
              value: ex.filename,
              label: `${ex.project_name} (${ex.filename})`,
            }))}
            value={selectedExample}
            onChange={(value) => setSelectedExample(value || "")}
            required
          />

          <TextInput
            label="New Simulation Name"
            placeholder="Enter name for the copy"
            value={newSimulationName}
            onChange={(e) => setNewSimulationName(e.target.value)}
            required
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setCopyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCopyExampleSubmit}
              loading={loading}
              disabled={!selectedExample || !newSimulationName.trim()}
            >
              Copy
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Simulation Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit: ${editingFilename}`}
        size="xl"
        fullScreen
      >
        <Stack gap="md" h="100%">
          {editingContent && (
            <Tabs defaultValue="visual" h="100%">
              <Tabs.List>
                <Tabs.Tab value="visual">Visual Editor</Tabs.Tab>
                <Tabs.Tab value="json">JSON Editor</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="visual" pt="md" h="calc(100% - 40px)">
                <ScrollArea h="100%">
                  <Stack gap="md">
                    <Text fw={500}>Basic Settings</Text>
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Project Name"
                          value={editingContent.project_name || ""}
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              project_name: e.target.value,
                            })
                          }
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <NumberInput
                          label="Simulation Time (s)"
                          value={
                            editingContent.environment?.simulation_time || 1.0
                          }
                          onChange={(value) =>
                            setEditingContent({
                              ...editingContent,
                              environment: {
                                ...editingContent.environment,
                                simulation_time: value || 1.0,
                              },
                            })
                          }
                          min={0.1}
                          step={0.1}
                        />
                      </Grid.Col>
                    </Grid>

                    <Text fw={500} mt="md">
                      Environment
                    </Text>
                    <Grid>
                      <Grid.Col span={4}>
                        <NumberInput
                          label="Gravity X"
                          value={editingContent.environment?.gravity?.[0] || 0}
                          onChange={(value) => {
                            const gravity = [
                              ...(editingContent.environment?.gravity || [
                                0, 0, -9.81,
                              ]),
                            ];
                            gravity[0] = value || 0;
                            setEditingContent({
                              ...editingContent,
                              environment: {
                                ...editingContent.environment,
                                gravity,
                              },
                            });
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <NumberInput
                          label="Gravity Y"
                          value={editingContent.environment?.gravity?.[1] || 0}
                          onChange={(value) => {
                            const gravity = [
                              ...(editingContent.environment?.gravity || [
                                0, 0, -9.81,
                              ]),
                            ];
                            gravity[1] = value || 0;
                            setEditingContent({
                              ...editingContent,
                              environment: {
                                ...editingContent.environment,
                                gravity,
                              },
                            });
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <NumberInput
                          label="Gravity Z"
                          value={
                            editingContent.environment?.gravity?.[2] || -9.81
                          }
                          onChange={(value) => {
                            const gravity = [
                              ...(editingContent.environment?.gravity || [
                                0, 0, -9.81,
                              ]),
                            ];
                            gravity[2] = value || -9.81;
                            setEditingContent({
                              ...editingContent,
                              environment: {
                                ...editingContent.environment,
                                gravity,
                              },
                            });
                          }}
                        />
                      </Grid.Col>
                    </Grid>

                    <Text fw={500} mt="md">
                      Components ({editingContent.components?.length || 0})
                    </Text>
                    <Text size="sm" c="dimmed">
                      Component editing is complex and currently best done in
                      JSON mode. Use the JSON Editor tab for detailed component
                      configuration.
                    </Text>
                  </Stack>
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="json" pt="md" h="calc(100% - 40px)">
                <Stack gap="md" h="100%">
                  <JsonInput
                    label="Simulation Configuration"
                    placeholder="JSON configuration"
                    value={JSON.stringify(editingContent, null, 2)}
                    onChange={(value) => {
                      try {
                        const parsed = JSON.parse(value);
                        setEditingContent(parsed);
                      } catch (e) {
                        // Invalid JSON, don't update
                      }
                    }}
                    minRows={20}
                    maxRows={30}
                    autosize
                  />
                </Stack>
              </Tabs.Panel>
            </Tabs>
          )}

          <Group justify="flex-end" gap="sm" mt="auto">
            <Button variant="light" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSaveEdit}
              loading={loading}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Custom Simulation"
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete this custom simulation? This action
            cannot be undone.
          </Text>

          {simulationToDelete && (
            <Text size="sm" c="dimmed">
              File: {simulationToDelete}
            </Text>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete} loading={loading}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

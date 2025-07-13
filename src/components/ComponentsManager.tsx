"use client";

import React, { useEffect, useState, useRef } from "react";
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
  ColorInput,
  Switch,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconAlertCircle,
  IconRefresh,
  IconDeviceFloppy,
  IconEye,
  IconCube,
} from "@tabler/icons-react";

import useStore, {
  Component,
  ComponentContent,
  CADCommand,
} from "../../app/store";
import CADCommandEditor, { CAD_COMMAND_TYPES } from "./CADCommandEditor";
import R3FViewer from "./R3FViewer";

export default function ComponentsManager() {
  const {
    components,
    selectedComponent,
    componentContent,
    loading,
    error,
    fetchComponents,
    selectComponent,
    fetchComponentContent,
    saveComponent,
    deleteComponent,
    generateComponentPreview,
    clearError,
  } = useStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<string | null>(
    null
  );

  const [newComponentName, setNewComponentName] = useState("");
  const [editingContent, setEditingContent] = useState<ComponentContent | null>(
    null
  );
  const [editingFilename, setEditingFilename] = useState("");
  const [previewData, setPreviewData] = useState<{
    data: string;
    format: string;
  } | null>(null);
  const [livePreview, setLivePreview] = useState(true);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState<
    number | null
  >(null);
  const lastPreviewCommandsRef = useRef<string>("");

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleCreateNew = () => {
    setNewComponentName("");
    setCreateModalOpen(true);
  };

  const handleEdit = (component: Component) => {
    selectComponent(component);
    fetchComponentContent(component.filename);
    setEditingFilename(component.filename);
    setEditModalOpen(true);
  };

  const handleDelete = (filename: string) => {
    setComponentToDelete(filename);
    setDeleteConfirmOpen(true);
  };

  const handlePreview = async (component: Component) => {
    selectComponent(component);
    await fetchComponentContent(component.filename);
    setPreviewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (componentToDelete) {
      const success = await deleteComponent(componentToDelete);
      if (success) {
        setDeleteConfirmOpen(false);
        setComponentToDelete(null);
      }
    }
  };

  const handleSaveNew = async () => {
    if (!newComponentName.trim()) return;

    const defaultContent: ComponentContent = {
      name: newComponentName,
      description: "New component",
      material: "aluminum",
      density: 2700,
      color: [0.7, 0.7, 0.7],
      cad_commands: [
        {
          command: "box",
          params: {
            length: 1.0,
            width: 1.0,
            height: 1.0,
            centered: true,
          },
        },
      ],
      collision: {
        enabled: true,
        shape: "box",
        params: {},
      },
    };

    const success = await saveComponent(
      newComponentName.replace(/\s+/g, "_").toLowerCase(),
      defaultContent
    );

    if (success) {
      setCreateModalOpen(false);
      setNewComponentName("");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingContent || !editingFilename) return;

    const success = await saveComponent(
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

  const handleGeneratePreview = async (
    commands?: CADCommand[],
    color?: [number, number, number],
    selectedIndex?: number | null
  ) => {
    const cadCommands = commands || componentContent?.cad_commands;
    const componentColor = color || componentContent?.color;

    if (!cadCommands || cadCommands.length === 0) {
      return;
    }

    // Check if commands have actually changed to prevent unnecessary regeneration
    const commandsString = JSON.stringify(cadCommands);
    if (commandsString === lastPreviewCommandsRef.current) {
      return; // Commands haven't changed, skip regeneration
    }

    // Special case: if commands array is empty, clear the preview
    if (cadCommands.length === 0) {
      setPreviewData(null);
      lastPreviewCommandsRef.current = commandsString;
      return;
    }

    lastPreviewCommandsRef.current = commandsString;
    setSelectedCommandIndex(selectedIndex || null);
    const preview = await generateComponentPreview(cadCommands, componentColor);
    if (preview) {
      setPreviewData(preview);
    }
  };

  // Update editing content when component content is loaded
  useEffect(() => {
    if (componentContent && editModalOpen) {
      setEditingContent(componentContent);
    }
    if (componentContent && previewModalOpen) {
      handleGeneratePreview();
    }
  }, [componentContent, editModalOpen, previewModalOpen]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={600}>
            Component Presets
          </Text>
          <Text size="sm" c="dimmed">
            Create and manage reusable CAD component presets
          </Text>
        </div>

        <Group gap="sm">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateNew}
          >
            Create Component
          </Button>
          <ActionIcon
            variant="light"
            onClick={fetchComponents}
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

      {/* Components List */}
      <Card withBorder p="md">
        <Text fw={500} mb="md">
          Your Components ({components.length})
        </Text>

        <ScrollArea h={400}>
          <Stack gap="sm">
            {components.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No components yet. Create one to get started!
              </Text>
            ) : (
              components.map((component) => (
                <Card key={component.filename} withBorder p="sm" radius="sm">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Text fw={500}>{component.name}</Text>
                        <Badge size="sm" variant="light">
                          {component.cad_commands} commands
                        </Badge>
                        {component.material && (
                          <Badge size="sm" variant="light" color="blue">
                            {component.material}
                          </Badge>
                        )}
                      </Group>

                      <Text size="sm" c="dimmed" mb="xs">
                        {component.description || "No description"}
                      </Text>

                      <Text size="xs" c="dimmed">
                        Created:{" "}
                        {new Date(component.created_at).toLocaleString()}
                      </Text>
                    </div>

                    <Group gap="xs">
                      <Tooltip label="Preview 3D">
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() => handlePreview(component)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleEdit(component)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(component.filename)}
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

      {/* Create New Component Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Component"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Component Name"
            placeholder="Enter component name"
            value={newComponentName}
            onChange={(e) => setNewComponentName(e.target.value)}
            required
          />

          <Text size="sm" c="dimmed">
            A basic component template will be created with a simple box shape.
            You can edit it after creation to customize the CAD commands and
            parameters.
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNew}
              loading={loading}
              disabled={!newComponentName.trim()}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Component Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit: ${editingFilename}`}
        size="xl"
        fullScreen
      >
        <Stack gap="md" h="100%">
          {editingContent && (
            <Tabs defaultValue="basic" h="100%">
              <Tabs.List>
                <Tabs.Tab value="basic">Basic Settings</Tabs.Tab>
                <Tabs.Tab value="commands">CAD Commands</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="basic" pt="md">
                <ScrollArea h="calc(100vh - 200px)">
                  <Stack gap="md">
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Component Name"
                          value={editingContent.name || ""}
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              name: e.target.value,
                            })
                          }
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Material"
                          value={editingContent.material || ""}
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              material: e.target.value,
                            })
                          }
                        />
                      </Grid.Col>
                    </Grid>

                    <Textarea
                      label="Description"
                      value={editingContent.description || ""}
                      onChange={(e) =>
                        setEditingContent({
                          ...editingContent,
                          description: e.target.value,
                        })
                      }
                      minRows={3}
                    />

                    <Grid>
                      <Grid.Col span={6}>
                        <NumberInput
                          label="Density (kg/m³)"
                          value={editingContent.density || 2700}
                          onChange={(value) =>
                            setEditingContent({
                              ...editingContent,
                              density: value || 2700,
                            })
                          }
                          min={1}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <ColorInput
                          label="Color"
                          value={`rgb(${Math.round(
                            (editingContent.color?.[0] || 0.7) * 255
                          )}, ${Math.round(
                            (editingContent.color?.[1] || 0.7) * 255
                          )}, ${Math.round(
                            (editingContent.color?.[2] || 0.7) * 255
                          )})`}
                          onChange={(value) => {
                            // Convert RGB string to normalized array
                            const match = value.match(
                              /rgb\((\d+),\s*(\d+),\s*(\d+)\)/
                            );
                            if (match) {
                              const color: [number, number, number] = [
                                parseInt(match[1]) / 255,
                                parseInt(match[2]) / 255,
                                parseInt(match[3]) / 255,
                              ];
                              setEditingContent({
                                ...editingContent,
                                color,
                              });
                            }
                          }}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="commands" pt="md">
                <Grid h="calc(100vh - 200px)">
                  <Grid.Col span={8}>
                    <ScrollArea h="100%">
                      <Group justify="space-between" mb="md">
                        <Text fw={500}>CAD Commands</Text>
                        <Switch
                          label="Live Preview"
                          checked={livePreview}
                          onChange={(event) =>
                            setLivePreview(event.currentTarget.checked)
                          }
                        />
                      </Group>

                      <CADCommandEditor
                        commands={editingContent.cad_commands || []}
                        onChange={(commands) =>
                          setEditingContent({
                            ...editingContent,
                            cad_commands: commands,
                          })
                        }
                        onPreview={
                          livePreview
                            ? async (commands, selectedIndex) => {
                                await handleGeneratePreview(
                                  commands,
                                  editingContent.color,
                                  selectedIndex
                                );
                              }
                            : undefined
                        }
                      />
                    </ScrollArea>
                  </Grid.Col>

                  <Grid.Col span={4}>
                    <Stack gap="md" h="100%">
                      <Text fw={500}>Live Preview</Text>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          minHeight: "300px",
                        }}
                      >
                        {loading ? (
                          <Text size="sm" c="dimmed">
                            Generating preview...
                          </Text>
                        ) : previewData && livePreview ? (
                          <R3FViewer
                            gltfData={
                              previewData.format === "gltf"
                                ? previewData.data
                                : undefined
                            }
                            glbData={
                              previewData.format === "glb"
                                ? previewData.data
                                : undefined
                            }
                            stlData={
                              previewData.format === "stl"
                                ? previewData.data
                                : undefined
                            }
                            width={300}
                            height={250}
                            selectedCommandIndex={selectedCommandIndex}
                            commands={(() => {
                              const commandsData =
                                editingContent.cad_commands?.map((cmd) => ({
                                  command: cmd.command,
                                  is2D:
                                    CAD_COMMAND_TYPES[
                                      cmd.command as keyof typeof CAD_COMMAND_TYPES
                                    ]?.is2D || false,
                                }));
                              console.log(
                                "ComponentsManager: Passing commands to R3FViewer",
                                {
                                  commandsData,
                                  selectedCommandIndex,
                                  has2D: commandsData?.some((cmd) => cmd.is2D),
                                }
                              );
                              return commandsData;
                            })()}
                          />
                        ) : (
                          <Text size="sm" c="dimmed">
                            {livePreview
                              ? "Add CAD commands to see preview"
                              : "Enable live preview to see changes"}
                          </Text>
                        )}
                      </div>
                    </Stack>
                  </Grid.Col>
                </Grid>
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
        title="Delete Component"
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete this component? This action cannot
            be undone.
          </Text>

          {componentToDelete && (
            <Text size="sm" c="dimmed">
              File: {componentToDelete}
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

      {/* Preview Modal */}
      <Modal
        opened={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewData(null);
        }}
        title={`Preview: ${selectedComponent?.name || "Component"}`}
        size="xl"
      >
        <Stack gap="md">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? (
              <Text>Generating preview...</Text>
            ) : previewData ? (
              <R3FViewer
                gltfData={
                  previewData.format === "gltf" ? previewData.data : undefined
                }
                glbData={
                  previewData.format === "glb" ? previewData.data : undefined
                }
                stlData={
                  previewData.format === "stl" ? previewData.data : undefined
                }
                width={600}
                height={400}
                selectedCommandIndex={selectedCommandIndex}
                commands={componentContent?.cad_commands?.map((cmd) => ({
                  command: cmd.command,
                  is2D:
                    CAD_COMMAND_TYPES[
                      cmd.command as keyof typeof CAD_COMMAND_TYPES
                    ]?.is2D || false,
                }))}
              />
            ) : (
              <Text c="dimmed">No preview available</Text>
            )}
          </div>

          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => {
                setPreviewModalOpen(false);
                setPreviewData(null);
              }}
            >
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

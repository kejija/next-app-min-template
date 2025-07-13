"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  Select,
  NumberInput,
  TextInput,
  ActionIcon,
  Tooltip,
  Grid,
  Collapse,
  Badge,
  Switch,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
  IconEye,
} from "@tabler/icons-react";

import { CADCommand } from "../../app/store";

interface CADCommandEditorProps {
  commands: CADCommand[];
  onChange: (commands: CADCommand[]) => void;
  onPreview?: (commands: CADCommand[]) => void;
}

// Define available CAD commands and their parameters
const CAD_COMMAND_TYPES = {
  // Basic shapes
  box: {
    label: "Box",
    category: "Basic Shapes",
    params: {
      length: { type: "number", default: 1.0, min: 0.001, label: "Length" },
      width: { type: "number", default: 1.0, min: 0.001, label: "Width" },
      height: { type: "number", default: 1.0, min: 0.001, label: "Height" },
      centered: { type: "boolean", default: true, label: "Centered" },
    },
  },
  cylinder: {
    label: "Cylinder",
    category: "Basic Shapes",
    params: {
      radius: { type: "number", default: 0.5, min: 0.001, label: "Radius" },
      height: { type: "number", default: 1.0, min: 0.001, label: "Height" },
      centered: { type: "boolean", default: true, label: "Centered" },
    },
  },
  sphere: {
    label: "Sphere",
    category: "Basic Shapes",
    params: {
      radius: { type: "number", default: 0.5, min: 0.001, label: "Radius" },
    },
  },
  cone: {
    label: "Cone",
    category: "Basic Shapes",
    params: {
      radius1: {
        type: "number",
        default: 0.5,
        min: 0.001,
        label: "Bottom Radius",
      },
      radius2: { type: "number", default: 0.1, min: 0, label: "Top Radius" },
      height: { type: "number", default: 1.0, min: 0.001, label: "Height" },
      centered: { type: "boolean", default: true, label: "Centered" },
    },
  },
  torus: {
    label: "Torus",
    category: "Basic Shapes",
    params: {
      major_radius: {
        type: "number",
        default: 1.0,
        min: 0.001,
        label: "Major Radius",
      },
      minor_radius: {
        type: "number",
        default: 0.2,
        min: 0.001,
        label: "Minor Radius",
      },
    },
  },
  // 2D shapes
  rect: {
    label: "Rectangle",
    category: "2D Shapes",
    params: {
      width: { type: "number", default: 1.0, min: 0.001, label: "Width" },
      height: { type: "number", default: 1.0, min: 0.001, label: "Height" },
      centered: { type: "boolean", default: true, label: "Centered" },
    },
  },
  circle: {
    label: "Circle",
    category: "2D Shapes",
    params: {
      radius: { type: "number", default: 0.5, min: 0.001, label: "Radius" },
    },
  },
  // Operations
  extrude: {
    label: "Extrude",
    category: "Operations",
    params: {
      distance: { type: "number", default: 1.0, min: 0.001, label: "Distance" },
    },
  },
  revolve: {
    label: "Revolve",
    category: "Operations",
    params: {
      angle: {
        type: "number",
        default: 360,
        min: 0.1,
        max: 360,
        label: "Angle (degrees)",
      },
    },
  },
  // Transformations
  translate: {
    label: "Translate",
    category: "Transformations",
    params: {
      x: { type: "number", default: 0, label: "X" },
      y: { type: "number", default: 0, label: "Y" },
      z: { type: "number", default: 0, label: "Z" },
    },
  },
  rotate: {
    label: "Rotate",
    category: "Transformations",
    params: {
      x: { type: "number", default: 0, label: "X (degrees)" },
      y: { type: "number", default: 0, label: "Y (degrees)" },
      z: { type: "number", default: 0, label: "Z (degrees)" },
    },
  },
  scale: {
    label: "Scale",
    category: "Transformations",
    params: {
      factor: {
        type: "number",
        default: 1.0,
        min: 0.001,
        label: "Scale Factor",
      },
    },
  },
  // Features
  fillet: {
    label: "Fillet",
    category: "Features",
    params: {
      radius: { type: "number", default: 0.1, min: 0.001, label: "Radius" },
    },
  },
  chamfer: {
    label: "Chamfer",
    category: "Features",
    params: {
      distance: { type: "number", default: 0.1, min: 0.001, label: "Distance" },
    },
  },
};

export default function CADCommandEditor({
  commands,
  onChange,
  onPreview,
}: CADCommandEditorProps) {
  const [expandedCommands, setExpandedCommands] = useState<Set<number>>(
    new Set()
  );

  // Debounced live preview
  useEffect(() => {
    if (!onPreview || commands.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onPreview(commands);
    }, 1000); // 1 second delay

    return () => {
      clearTimeout(timeoutId);
    };
  }, [commands]); // Remove onPreview from dependencies to prevent infinite loop

  const addCommand = () => {
    const newCommand: CADCommand = {
      command: "box",
      params: {
        length: 1.0,
        width: 1.0,
        height: 1.0,
        centered: true,
      },
    };
    onChange([...commands, newCommand]);
  };

  const removeCommand = (index: number) => {
    const newCommands = commands.filter((_, i) => i !== index);
    onChange(newCommands);

    // Force preview update after removal
    if (onPreview) {
      setTimeout(() => onPreview(newCommands), 100);
    }
  };

  const updateCommand = (index: number, updates: Partial<CADCommand>) => {
    const newCommands = [...commands];
    newCommands[index] = { ...newCommands[index], ...updates };
    onChange(newCommands);
  };

  const updateCommandType = (index: number, commandType: string) => {
    const commandDef =
      CAD_COMMAND_TYPES[commandType as keyof typeof CAD_COMMAND_TYPES];
    if (!commandDef) return;

    // Create default parameters for the new command type
    const defaultParams: Record<string, any> = {};
    Object.entries(commandDef.params).forEach(([key, paramDef]) => {
      defaultParams[key] = paramDef.default;
    });

    updateCommand(index, {
      command: commandType,
      params: defaultParams,
    });
  };

  const updateCommandParam = (index: number, paramKey: string, value: any) => {
    const newCommands = [...commands];
    newCommands[index] = {
      ...newCommands[index],
      params: {
        ...newCommands[index].params,
        [paramKey]: value,
      },
    };
    onChange(newCommands);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedCommands);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCommands(newExpanded);
  };

  const moveCommand = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= commands.length) return;

    const newCommands = [...commands];
    const [movedCommand] = newCommands.splice(fromIndex, 1);
    newCommands.splice(toIndex, 0, movedCommand);
    onChange(newCommands);
  };

  const renderParameterInput = (
    commandIndex: number,
    paramKey: string,
    paramDef: any,
    currentValue: any
  ) => {
    if (paramDef.type === "number") {
      return (
        <NumberInput
          label={paramDef.label}
          value={currentValue ?? paramDef.default}
          onChange={(value) =>
            updateCommandParam(commandIndex, paramKey, value)
          }
          min={paramDef.min}
          max={paramDef.max}
          step={paramDef.step || 0.1}
          precision={3}
        />
      );
    } else if (paramDef.type === "boolean") {
      return (
        <Switch
          label={paramDef.label}
          checked={currentValue ?? paramDef.default}
          onChange={(event) =>
            updateCommandParam(
              commandIndex,
              paramKey,
              event.currentTarget.checked
            )
          }
        />
      );
    } else {
      return (
        <TextInput
          label={paramDef.label}
          value={currentValue ?? paramDef.default}
          onChange={(event) =>
            updateCommandParam(
              commandIndex,
              paramKey,
              event.currentTarget.value
            )
          }
        />
      );
    }
  };

  // Group command types by category
  const commandOptions = React.useMemo(() => {
    return Object.entries(CAD_COMMAND_TYPES).map(([key, def]) => ({
      value: key,
      label: `${def.label} (${def.category})`,
    }));
  }, []);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={500}>CAD Commands ({commands.length})</Text>
        <Group gap="sm">
          {onPreview && (
            <Button
              variant="light"
              leftSection={<IconEye size={16} />}
              onClick={() => onPreview(commands)}
              size="sm"
            >
              Preview
            </Button>
          )}
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={addCommand}
            size="sm"
          >
            Add Command
          </Button>
        </Group>
      </Group>

      {commands.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No commands yet. Add a command to get started!
        </Text>
      ) : (
        <Stack gap="sm">
          {commands.map((command, index) => {
            const commandDef =
              CAD_COMMAND_TYPES[
                command.command as keyof typeof CAD_COMMAND_TYPES
              ];
            const isExpanded = expandedCommands.has(index);

            return (
              <Card key={index} withBorder p="sm">
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      style={{ cursor: "grab" }}
                      onMouseDown={(e) => {
                        // Simple drag implementation could be added here
                        e.preventDefault();
                      }}
                    >
                      <IconGripVertical size={14} />
                    </ActionIcon>

                    <Badge variant="light" size="sm">
                      {index + 1}
                    </Badge>

                    <Text fw={500} size="sm">
                      {commandDef?.label || command.command}
                    </Text>

                    {commandDef && (
                      <Badge variant="outline" size="xs">
                        {commandDef.category}
                      </Badge>
                    )}
                  </Group>

                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => toggleExpanded(index)}
                    >
                      {isExpanded ? (
                        <IconChevronUp size={14} />
                      ) : (
                        <IconChevronDown size={14} />
                      )}
                    </ActionIcon>

                    <Tooltip label="Delete command">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => removeCommand(index)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>

                <Collapse in={isExpanded}>
                  <Stack gap="md" pt="md">
                    <Select
                      label="Command Type"
                      value={command.command}
                      onChange={(value) =>
                        value && updateCommandType(index, value)
                      }
                      data={commandOptions}
                    />

                    {commandDef && (
                      <Grid>
                        {Object.entries(commandDef.params).map(
                          ([paramKey, paramDef]) => (
                            <Grid.Col key={paramKey} span={6}>
                              {renderParameterInput(
                                index,
                                paramKey,
                                paramDef,
                                command.params?.[paramKey]
                              )}
                            </Grid.Col>
                          )
                        )}
                      </Grid>
                    )}
                  </Stack>
                </Collapse>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

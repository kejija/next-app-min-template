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
  Flex,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
  IconEye,
  IconEyeOff,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBox,
  IconCircle,
  IconCone,
  IconSphere,
  IconSquare,
  IconPolygon,
  IconArrowUp,
  IconRotate,
  IconCirclePlus,
  IconMinus,
  IconCircleX,
  IconArrowsMove,
  IconScale,
  IconFlipHorizontal,
  IconBorderRadius,
  IconSlash,
  IconBorderStyle,
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
  polygon: {
    label: "Polygon",
    category: "2D Shapes",
    params: {
      sides: { type: "number", default: 6, min: 3, max: 20, label: "Sides" },
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
  // Boolean operations
  union: {
    label: "Union",
    category: "Boolean",
    params: {
      objects: {
        type: "command_references",
        default: [],
        label: "Objects to Union",
        description: "Select previous commands to union with current object",
      },
    },
  },
  cut: {
    label: "Cut/Subtract",
    category: "Boolean",
    params: {
      objects: {
        type: "command_references",
        default: [],
        label: "Objects to Cut",
        description: "Select previous commands to subtract from current object",
      },
    },
  },
  intersect: {
    label: "Intersect",
    category: "Boolean",
    params: {
      objects: {
        type: "command_references",
        default: [],
        label: "Objects to Intersect",
        description:
          "Select previous commands to intersect with current object",
      },
    },
  },
  // Transformations
  translate: {
    label: "Translate",
    category: "Transform",
    params: {
      x: { type: "number", default: 0.0, label: "X" },
      y: { type: "number", default: 0.0, label: "Y" },
      z: { type: "number", default: 0.0, label: "Z" },
    },
  },
  rotate: {
    label: "Rotate",
    category: "Transform",
    params: {
      angle: { type: "number", default: 0.0, label: "Angle (degrees)" },
      axis_start: { type: "vector3", default: [0, 0, 0], label: "Axis Start" },
      axis_end: { type: "vector3", default: [0, 0, 1], label: "Axis End" },
    },
  },
  scale: {
    label: "Scale",
    category: "Transform",
    params: {
      factor: {
        type: "number",
        default: 1.0,
        min: 0.001,
        label: "Scale Factor",
      },
    },
  },
  mirror: {
    label: "Mirror",
    category: "Transform",
    params: {
      plane: {
        type: "select",
        default: "XY",
        options: ["XY", "XZ", "YZ"],
        label: "Mirror Plane",
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
  shell: {
    label: "Shell",
    category: "Features",
    params: {
      thickness: {
        type: "number",
        default: 0.1,
        min: 0.001,
        label: "Thickness",
      },
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
  const [commandHistory, setCommandHistory] = useState<CADCommand[][]>([
    commands,
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Update history when commands change
  useEffect(() => {
    setCommandHistory([commands]);
    setHistoryIndex(0);
  }, [commands]);

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

  // Save to history
  const saveToHistory = (newCommands: CADCommand[]) => {
    const newHistory = commandHistory.slice(0, historyIndex + 1);
    newHistory.push(newCommands);
    setCommandHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange(newCommands);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(commandHistory[newIndex]);
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < commandHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(commandHistory[newIndex]);
    }
  };

  const addCommand = () => {
    const newCommand: CADCommand = {
      command: "box",
      params: {
        length: 1.0,
        width: 1.0,
        height: 1.0,
        centered: true,
      },
      hidden: false,
    };
    saveToHistory([...commands, newCommand]);
  };

  const removeCommand = (index: number) => {
    const newCommands = commands.filter((_, i) => i !== index);
    saveToHistory(newCommands);

    // Force preview update after removal
    if (onPreview) {
      setTimeout(() => onPreview(newCommands), 100);
    }
  };

  const toggleCommandVisibility = (index: number) => {
    const newCommands = [...commands];
    newCommands[index] = {
      ...newCommands[index],
      hidden: !newCommands[index].hidden,
    };
    saveToHistory(newCommands);
  };

  const updateCommand = (index: number, updates: Partial<CADCommand>) => {
    const newCommands = [...commands];
    newCommands[index] = { ...newCommands[index], ...updates };
    saveToHistory(newCommands);
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
    saveToHistory(newCommands);
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
    } else if (paramDef.type === "select") {
      return (
        <Select
          label={paramDef.label}
          value={currentValue ?? paramDef.default}
          onChange={(value) =>
            updateCommandParam(commandIndex, paramKey, value)
          }
          data={paramDef.options || []}
        />
      );
    } else if (paramDef.type === "command_references") {
      // Create options from previous commands
      const commandOptions = commands
        .slice(0, commandIndex)
        .map((cmd, idx) => ({
          value: idx.toString(),
          label: `${idx + 1}. ${
            CAD_COMMAND_TYPES[cmd.command as keyof typeof CAD_COMMAND_TYPES]
              ?.label || cmd.command
          }`,
        }));

      return (
        <div>
          <Text size="sm" fw={500} mb="xs">
            {paramDef.label}
          </Text>
          {paramDef.description && (
            <Text size="xs" c="dimmed" mb="sm">
              {paramDef.description}
            </Text>
          )}
          <Select
            placeholder="Select commands to reference"
            value={null}
            onChange={(value) => {
              if (value) {
                const currentRefs = currentValue || [];
                if (!currentRefs.includes(parseInt(value))) {
                  updateCommandParam(commandIndex, paramKey, [
                    ...currentRefs,
                    parseInt(value),
                  ]);
                }
              }
            }}
            data={commandOptions}
            disabled={commandOptions.length === 0}
          />
          {(currentValue || []).length > 0 && (
            <Stack gap="xs" mt="sm">
              {(currentValue || []).map((refIndex: number) => (
                <Group key={refIndex} justify="space-between">
                  <Text size="sm">
                    {refIndex + 1}.{" "}
                    {CAD_COMMAND_TYPES[
                      commands[refIndex]
                        ?.command as keyof typeof CAD_COMMAND_TYPES
                    ]?.label || commands[refIndex]?.command}
                  </Text>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => {
                      const newRefs = (currentValue || []).filter(
                        (idx: number) => idx !== refIndex
                      );
                      updateCommandParam(commandIndex, paramKey, newRefs);
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          )}
        </div>
      );
    } else if (paramDef.type === "vector3") {
      const vector = currentValue || paramDef.default || [0, 0, 0];
      return (
        <div>
          <Text size="sm" fw={500} mb="xs">
            {paramDef.label}
          </Text>
          <Group gap="xs">
            <NumberInput
              placeholder="X"
              value={vector[0]}
              onChange={(value) => {
                const newVector = [...vector];
                newVector[0] = value || 0;
                updateCommandParam(commandIndex, paramKey, newVector);
              }}
              size="sm"
              style={{ flex: 1 }}
            />
            <NumberInput
              placeholder="Y"
              value={vector[1]}
              onChange={(value) => {
                const newVector = [...vector];
                newVector[1] = value || 0;
                updateCommandParam(commandIndex, paramKey, newVector);
              }}
              size="sm"
              style={{ flex: 1 }}
            />
            <NumberInput
              placeholder="Z"
              value={vector[2]}
              onChange={(value) => {
                const newVector = [...vector];
                newVector[2] = value || 0;
                updateCommandParam(commandIndex, paramKey, newVector);
              }}
              size="sm"
              style={{ flex: 1 }}
            />
          </Group>
        </div>
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

  // Quick add command function
  const addQuickCommand = (commandType: string) => {
    const commandDef =
      CAD_COMMAND_TYPES[commandType as keyof typeof CAD_COMMAND_TYPES];
    if (!commandDef) return;

    // Create default parameters for the command type
    const defaultParams: Record<string, any> = {};
    Object.entries(commandDef.params).forEach(([key, paramDef]) => {
      defaultParams[key] = paramDef.default;
    });

    const newCommand: CADCommand = {
      command: commandType,
      params: defaultParams,
      hidden: false,
    };
    saveToHistory([...commands, newCommand]);
  };

  // Command icon mapping
  const getCommandIcon = (commandType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      box: <IconBox size={16} />,
      cylinder: <IconCircle size={16} />,
      sphere: <IconSphere size={16} />,
      cone: <IconCone size={16} />,
      torus: <IconCircle size={16} />,
      rect: <IconSquare size={16} />,
      circle: <IconCircle size={16} />,
      polygon: <IconPolygon size={16} />,
      extrude: <IconArrowUp size={16} />,
      revolve: <IconRotate size={16} />,
      union: <IconCirclePlus size={16} />,
      cut: <IconMinus size={16} />,
      intersect: <IconCircleX size={16} />,
      translate: <IconArrowsMove size={16} />,
      rotate: <IconRotate size={16} />,
      scale: <IconScale size={16} />,
      mirror: <IconFlipHorizontal size={16} />,
      fillet: <IconBorderRadius size={16} />,
      chamfer: <IconSlash size={16} />,
      shell: <IconBorderStyle size={16} />,
    };
    return iconMap[commandType] || <IconPlus size={16} />;
  };

  // Toolbar categories
  const toolbarCategories = [
    {
      name: "Basic Shapes",
      commands: ["box", "cylinder", "sphere", "cone", "torus"],
    },
    {
      name: "2D Shapes",
      commands: ["rect", "circle", "polygon"],
    },
    {
      name: "Operations",
      commands: ["extrude", "revolve"],
    },
    {
      name: "Boolean",
      commands: ["union", "cut", "intersect"],
    },
    {
      name: "Transform",
      commands: ["translate", "rotate", "scale", "mirror"],
    },
    {
      name: "Features",
      commands: ["fillet", "chamfer", "shell"],
    },
  ];

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

      {/* Quick Add Toolbar */}
      <Card withBorder p="xs">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>
            Quick Add
          </Text>
          <Group gap="xs">
            <Tooltip label="Undo">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <IconArrowBackUp size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Redo">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= commandHistory.length - 1}
              >
                <IconArrowForwardUp size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        <Flex gap="xs" direction="row">
          {toolbarCategories.map((category) => (
            <div key={category.name}>
              <Text size="xs" c="dimmed" mb="xs">
                {category.name}
              </Text>
              <Button.Group>
                {category.commands.map((commandType) => {
                  const commandDef =
                    CAD_COMMAND_TYPES[
                      commandType as keyof typeof CAD_COMMAND_TYPES
                    ];
                  return (
                    <Tooltip
                      key={commandType}
                      label={commandDef?.label || commandType}
                    >
                      <Button
                        variant="light"
                        size="xs"
                        onClick={() => addQuickCommand(commandType)}
                        px="xs"
                      >
                        {getCommandIcon(commandType)}
                      </Button>
                    </Tooltip>
                  );
                })}
              </Button.Group>
            </div>
          ))}
        </Flex>
      </Card>

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
              <Card
                key={index}
                withBorder
                p="sm"
                style={{
                  opacity: command.hidden ? 0.5 : 1,
                  borderStyle: command.hidden ? "dashed" : "solid",
                }}
              >
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
                      <Badge
                        variant="outline"
                        size="xs"
                        color={
                          commandDef.category === "Boolean"
                            ? "red"
                            : commandDef.category === "Basic Shapes"
                            ? "blue"
                            : commandDef.category === "2D Shapes"
                            ? "green"
                            : commandDef.category === "Operations"
                            ? "orange"
                            : commandDef.category === "Transform"
                            ? "purple"
                            : commandDef.category === "Features"
                            ? "teal"
                            : "gray"
                        }
                      >
                        {commandDef.category}
                      </Badge>
                    )}

                    {/* Show icon for command type */}
                    {getCommandIcon(command.command)}
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

                    <Tooltip
                      label={command.hidden ? "Show command" : "Hide command"}
                    >
                      <ActionIcon
                        variant="subtle"
                        color={command.hidden ? "gray" : "blue"}
                        size="sm"
                        onClick={() => toggleCommandVisibility(index)}
                      >
                        {command.hidden ? (
                          <IconEyeOff size={14} />
                        ) : (
                          <IconEye size={14} />
                        )}
                      </ActionIcon>
                    </Tooltip>

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

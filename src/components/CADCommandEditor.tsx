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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { CADCommand } from "../../app/store";

interface CADCommandEditorProps {
  commands: CADCommand[];
  onChange: (commands: CADCommand[]) => void;
  onPreview?: (commands: CADCommand[], selectedIndex?: number | null) => void;
}

interface SortableCommandItemProps {
  command: CADCommand;
  index: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpanded: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onUpdateType: (commandType: string) => void;
  onUpdateParam: (paramKey: string, value: any) => void;
  onSelect: () => void;
  commands: CADCommand[];
  commandOptions: Array<{ value: string; label: string }>;
}

function SortableCommandItem({
  command,
  index,
  isExpanded,
  isSelected,
  onToggleExpanded,
  onToggleVisibility,
  onRemove,
  onUpdateType,
  onUpdateParam,
  onSelect,
  commands,
  commandOptions,
}: SortableCommandItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `command-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const commandDef =
    CAD_COMMAND_TYPES[command.command as keyof typeof CAD_COMMAND_TYPES];

  const renderParameterInput = (
    paramKey: string,
    paramDef: any,
    currentValue: any
  ) => {
    if (paramDef.type === "number") {
      return (
        <NumberInput
          label={paramDef.label}
          value={currentValue ?? paramDef.default}
          onChange={(value) => onUpdateParam(paramKey, value)}
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
            onUpdateParam(paramKey, event.currentTarget.checked)
          }
        />
      );
    } else if (paramDef.type === "select") {
      return (
        <Select
          label={paramDef.label}
          value={currentValue ?? paramDef.default}
          onChange={(value) => onUpdateParam(paramKey, value)}
          data={paramDef.options || []}
        />
      );
    } else if (paramDef.type === "command_references") {
      // Create options from previous commands
      const commandOptions = commands.slice(0, index).map((cmd, idx) => ({
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
                  onUpdateParam(paramKey, [...currentRefs, parseInt(value)]);
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
                      onUpdateParam(paramKey, newRefs);
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
                onUpdateParam(paramKey, newVector);
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
                onUpdateParam(paramKey, newVector);
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
                onUpdateParam(paramKey, newVector);
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
            onUpdateParam(paramKey, event.currentTarget.value)
          }
        />
      );
    }
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

  const is2DShape = commandDef?.is2D || false;

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...style,
        opacity: command.hidden ? 0.5 : 1,
        borderStyle: command.hidden ? "dashed" : "solid",
        borderColor: isSelected ? "#228be6" : undefined,
        borderWidth: isSelected ? "2px" : "1px",
        backgroundColor: isSelected ? "#f0f8ff" : undefined,
        cursor: "pointer",
      }}
      withBorder
      p="sm"
      onClick={onSelect}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            size="sm"
            style={{ cursor: "grab" }}
            {...attributes}
            {...listeners}
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
          <ActionIcon variant="subtle" size="sm" onClick={onToggleExpanded}>
            {isExpanded ? (
              <IconChevronUp size={14} />
            ) : (
              <IconChevronDown size={14} />
            )}
          </ActionIcon>

          <Tooltip label={command.hidden ? "Show command" : "Hide command"}>
            <ActionIcon
              variant="subtle"
              color={command.hidden ? "gray" : "blue"}
              size="sm"
              onClick={onToggleVisibility}
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
              onClick={onRemove}
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
            onChange={(value) => value && onUpdateType(value)}
            data={commandOptions}
          />

          {commandDef && (
            <Grid>
              {Object.entries(commandDef.params).map(([paramKey, paramDef]) => (
                <Grid.Col key={paramKey} span={6}>
                  {renderParameterInput(
                    paramKey,
                    paramDef,
                    command.params?.[paramKey]
                  )}
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      </Collapse>
    </Card>
  );
}

// Define available CAD commands and their parameters
export const CAD_COMMAND_TYPES = {
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
    is2D: true,
    params: {
      width: { type: "number", default: 1.0, min: 0.001, label: "Width" },
      height: { type: "number", default: 1.0, min: 0.001, label: "Height" },
      centered: { type: "boolean", default: true, label: "Centered" },
    },
  },
  circle: {
    label: "Circle",
    category: "2D Shapes",
    is2D: true,
    params: {
      radius: { type: "number", default: 0.5, min: 0.001, label: "Radius" },
    },
  },
  polygon: {
    label: "Polygon",
    category: "2D Shapes",
    is2D: true,
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
      target: {
        type: "command_references",
        default: [],
        label: "Target Objects",
        description: "Select previous commands to transform",
      },
      x: { type: "number", default: 0.0, label: "X" },
      y: { type: "number", default: 0.0, label: "Y" },
      z: { type: "number", default: 0.0, label: "Z" },
    },
  },
  rotate: {
    label: "Rotate",
    category: "Transform",
    params: {
      target: {
        type: "command_references",
        default: [],
        label: "Target Objects",
        description: "Select previous commands to transform",
      },
      angle: { type: "number", default: 0.0, label: "Angle (degrees)" },
      axis_start: { type: "vector3", default: [0, 0, 0], label: "Axis Start" },
      axis_end: { type: "vector3", default: [0, 0, 1], label: "Axis End" },
    },
  },
  scale: {
    label: "Scale",
    category: "Transform",
    params: {
      target: {
        type: "command_references",
        default: [],
        label: "Target Objects",
        description: "Select previous commands to transform",
      },
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
      target: {
        type: "command_references",
        default: [],
        label: "Target Objects",
        description: "Select previous commands to transform",
      },
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
  const [selectedCommand, setSelectedCommand] = useState<number | null>(null);
  const [commandHistory, setCommandHistory] = useState<CADCommand[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize history when component mounts or commands change from parent
  useEffect(() => {
    if (commandHistory.length === 0) {
      setCommandHistory([commands]);
      setHistoryIndex(0);
    }
  }, [commands, commandHistory]);

  // Debounced live preview
  useEffect(() => {
    if (!onPreview || commands.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onPreview(commands, selectedCommand);
    }, 1000); // 1 second delay

    return () => {
      clearTimeout(timeoutId);
    };
  }, [commands, selectedCommand]); // Include selectedCommand to update preview on selection

  // Save to history
  const saveToHistory = (newCommands: CADCommand[]) => {
    // Remove any history after current index (when making changes after undo)
    const newHistory = commandHistory.slice(0, historyIndex + 1);
    newHistory.push([...newCommands]); // Deep copy to avoid reference issues
    setCommandHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange(newCommands);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange([...commandHistory[newIndex]]); // Deep copy
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < commandHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange([...commandHistory[newIndex]]); // Deep copy
    }
  };

  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < commandHistory.length - 1;

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
      setTimeout(() => onPreview(newCommands, selectedCommand), 100);
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

    // For boolean operations, also set objects at root level
    const commandUpdate: any = {
      command: commandType,
      params: defaultParams,
    };

    if (["union", "cut", "intersect"].includes(commandType)) {
      commandUpdate.objects = defaultParams.objects || [];
    }

    if (["translate", "rotate", "scale", "mirror"].includes(commandType)) {
      commandUpdate.target = defaultParams.target || [];
    }

    updateCommand(index, commandUpdate);
  };

  const updateCommandParam = (index: number, paramKey: string, value: any) => {
    const newCommands = [...commands];

    // For boolean operations, store objects at root level for backend compatibility
    if (
      paramKey === "objects" &&
      ["union", "cut", "intersect"].includes(newCommands[index].command)
    ) {
      newCommands[index] = {
        ...newCommands[index],
        objects: value,
        params: {
          ...newCommands[index].params,
          [paramKey]: value,
        },
      };
    }
    // For transform operations, store target at root level for backend compatibility
    else if (
      paramKey === "target" &&
      ["translate", "rotate", "scale", "mirror"].includes(
        newCommands[index].command
      )
    ) {
      newCommands[index] = {
        ...newCommands[index],
        target: value,
        params: {
          ...newCommands[index].params,
          [paramKey]: value,
        },
      };
    } else {
      newCommands[index] = {
        ...newCommands[index],
        params: {
          ...newCommands[index].params,
          [paramKey]: value,
        },
      };
    }

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

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = commands.findIndex(
        (_, index) => `command-${index}` === active.id
      );
      const newIndex = commands.findIndex(
        (_, index) => `command-${index}` === over?.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCommands = arrayMove(commands, oldIndex, newIndex);
        saveToHistory(newCommands);
      }
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

  // Command icon mapping for toolbar
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
              onClick={() => onPreview(commands, selectedCommand)}
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
                disabled={!canUndo}
              >
                <IconArrowBackUp size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Redo">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={commands.map((_, index) => `command-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <Stack gap="sm">
              {commands.map((command, index) => (
                <SortableCommandItem
                  key={`command-${index}`}
                  command={command}
                  index={index}
                  isExpanded={expandedCommands.has(index)}
                  isSelected={selectedCommand === index}
                  onToggleExpanded={() => toggleExpanded(index)}
                  onToggleVisibility={() => toggleCommandVisibility(index)}
                  onRemove={() => removeCommand(index)}
                  onUpdateType={(commandType) =>
                    updateCommandType(index, commandType)
                  }
                  onUpdateParam={(paramKey, value) =>
                    updateCommandParam(index, paramKey, value)
                  }
                  onSelect={() =>
                    setSelectedCommand(selectedCommand === index ? null : index)
                  }
                  commands={commands}
                  commandOptions={commandOptions}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}
    </Stack>
  );
}

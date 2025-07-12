"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Modal,
  ScrollArea,
  Loader,
  Alert,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconEye,
  IconClock,
  IconCube,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";

// Dynamically import ReactJsonView to avoid SSR issues
const ReactJsonView = dynamic(() => import("react-json-view"), {
  ssr: false,
  loading: () => <div>Loading JSON viewer...</div>,
});
import useStore, { Example } from "../../app/store";

interface ExamplesPanelProps {
  onRunSimulation?: (example: Example) => void;
}

export default function ExamplesPanel({ onRunSimulation }: ExamplesPanelProps) {
  const {
    examples,
    selectedExample,
    exampleContent,
    loading,
    error,
    fetchExamples,
    selectExample,
    fetchExampleContent,
    clearError,
  } = useStore();

  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    fetchExamples();
  }, [fetchExamples]);

  const handleViewExample = async (example: Example) => {
    selectExample(example);
    await fetchExampleContent(example.filename);
    setViewModalOpen(true);
  };

  const handleRunExample = (example: Example) => {
    selectExample(example);
    onRunSimulation?.(example);
  };

  const handleRefresh = () => {
    clearError();
    fetchExamples();
  };

  if (loading && examples.length === 0) {
    return (
      <Card withBorder p="md">
        <Group justify="center">
          <Loader size="sm" />
          <Text size="sm">Loading examples...</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          Example Simulations
        </Text>
        <Tooltip label="Refresh examples">
          <ActionIcon variant="light" onClick={handleRefresh} loading={loading}>
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

      <ScrollArea h={400}>
        <Stack gap="sm">
          {examples.map((example) => (
            <Card key={example.filename} withBorder p="md" radius="md">
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={500} size="sm">
                      {example.project_name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {example.filename}
                    </Text>
                  </div>
                  <Group gap="xs">
                    <Tooltip label="View configuration">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        onClick={() => handleViewExample(example)}
                      >
                        <IconEye size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Run simulation">
                      <ActionIcon
                        variant="filled"
                        size="sm"
                        color="blue"
                        onClick={() => handleRunExample(example)}
                      >
                        <IconPlayerPlay size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>

                <Group gap="xs">
                  <Badge
                    size="xs"
                    variant="light"
                    leftSection={<IconCube size={10} />}
                  >
                    {example.components} components
                  </Badge>
                  <Badge
                    size="xs"
                    variant="light"
                    leftSection={<IconClock size={10} />}
                  >
                    {example.simulation_time}s
                  </Badge>
                </Group>

                <Text size="xs" c="dimmed" lineClamp={2}>
                  {example.description}
                </Text>
              </Stack>
            </Card>
          ))}
        </Stack>
      </ScrollArea>

      {/* View Example Modal */}
      <Modal
        opened={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={
          <Group>
            <Text fw={600}>Configuration</Text>
            {selectedExample && (
              <Badge variant="light">{selectedExample.filename}</Badge>
            )}
          </Group>
        }
        size="xl"
      >
        <Stack gap="md">
          {selectedExample && (
            <Group>
              <Badge leftSection={<IconCube size={12} />}>
                {selectedExample.components} components
              </Badge>
              <Badge leftSection={<IconClock size={12} />}>
                {selectedExample.simulation_time}s simulation
              </Badge>
            </Group>
          )}

          <ScrollArea h={500}>
            {loading ? (
              <Group justify="center" p="xl">
                <Loader size="sm" />
                <Text size="sm">Loading configuration...</Text>
              </Group>
            ) : exampleContent ? (
              <ReactJsonView
                src={exampleContent}
                theme="rjv-default"
                collapsed={1}
                displayDataTypes={false}
                displayObjectSize={false}
                enableClipboard={false}
                name={false}
              />
            ) : (
              <Text c="dimmed" ta="center" p="xl">
                No content available
              </Text>
            )}
          </ScrollArea>

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            {selectedExample && (
              <Button
                leftSection={<IconPlayerPlay size={16} />}
                onClick={() => {
                  handleRunExample(selectedExample);
                  setViewModalOpen(false);
                }}
              >
                Run Simulation
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

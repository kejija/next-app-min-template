"use client";

import React, { useState } from "react";
import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  ScrollArea,
  Grid,
  Container,
  Title,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBulb,
  IconRun,
  IconChartLine,
  IconCube,
  IconSettings,
} from "@tabler/icons-react";
import useStore, { Example } from "./store";
import ExamplesPanel from "../src/components/ExamplesPanel";
import SimulationManager from "../src/components/SimulationManager";
import ResultsCharts from "../src/components/ResultsCharts";
import GLTFViewer from "../src/components/GLTFViewer";

type ActiveTab = "examples" | "simulations" | "results" | "viewer";

export default function MainPage() {
  const [opened, { toggle }] = useDisclosure();
  const [activeTab, setActiveTab] = useState<ActiveTab>("examples");
  const {
    selectedExample,
    simulationData,
    simulationResults,
    currentSimulation,
  } = useStore();

  const navItems = [
    {
      icon: IconBulb,
      label: "Examples",
      value: "examples" as ActiveTab,
      description: "Browse and select simulation examples",
    },
    {
      icon: IconRun,
      label: "Simulations",
      value: "simulations" as ActiveTab,
      description: "Manage and run simulations",
    },
    {
      icon: IconChartLine,
      label: "Results",
      value: "results" as ActiveTab,
      description: "View charts and analysis",
    },
    {
      icon: IconCube,
      label: "3D Viewer",
      value: "viewer" as ActiveTab,
      description: "View 3D models and animations",
    },
  ];

  const handleExampleRun = (example: Example) => {
    setActiveTab("simulations");
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case "examples":
        return <ExamplesPanel onRunSimulation={handleExampleRun} />;

      case "simulations":
        return <SimulationManager selectedExample={selectedExample} />;

      case "results":
        return (
          <ResultsCharts
            simulationData={simulationData}
            simulationId={currentSimulation || undefined}
          />
        );

      case "viewer":
        const currentResults = currentSimulation
          ? simulationResults[currentSimulation]
          : null;
        const gltfFile = currentResults?.files.find((f) =>
          f.name.endsWith(".gltf")
        );
        const gltfUrl =
          gltfFile && currentSimulation
            ? `http://localhost:5001/api/simulations/${currentSimulation}/download/${gltfFile.path}`
            : undefined;

        return (
          <GLTFViewer
            gltfUrl={gltfUrl}
            simulationData={simulationData}
            width={800}
            height={600}
            showControls={true}
            autoRotate={false}
          />
        );

      default:
        return <ExamplesPanel onRunSimulation={handleExampleRun} />;
    }
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap="xs">
              <IconCube size={28} color="blue" />
              <div>
                <Title order={4}>FE CAD Simulation</Title>
                <Text size="xs" c="dimmed">
                  CAD • PyBullet • FEniCS Pipeline
                </Text>
              </div>
            </Group>
          </Group>

          <Group gap="xs">
            {selectedExample && (
              <Badge variant="light" size="sm">
                {selectedExample.project_name}
              </Badge>
            )}
            {currentSimulation && (
              <Badge variant="filled" size="sm" color="blue">
                Active Simulation
              </Badge>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="md">
            Navigation
          </Text>

          {navItems.map((item) => (
            <NavLink
              key={item.value}
              active={activeTab === item.value}
              label={item.label}
              description={item.description}
              leftSection={<item.icon size={20} stroke={1.5} />}
              onClick={() => setActiveTab(item.value)}
              mb="xs"
            />
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">{renderMainContent()}</Container>
      </AppShell.Main>
    </AppShell>
  );
}

"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  Text,
  Group,
  Stack,
  Select,
  Badge,
  Tabs,
  Grid,
  Alert,
  ScrollArea,
} from "@mantine/core";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  IconChartLine,
  IconChartArea,
  IconChartBar,
  IconChartDots,
  IconAlertCircle,
} from "@tabler/icons-react";
import { SimulationData } from "../../app/store";

interface ResultsChartsProps {
  simulationData?: SimulationData[] | null;
  simulationId?: string;
}

interface ChartDataPoint {
  time: number;
  [key: string]: number;
}

export default function ResultsCharts({
  simulationData,
  simulationId,
}: ResultsChartsProps) {
  const [selectedComponent, setSelectedComponent] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<string>("position");

  console.log(
    "ResultsCharts render - selectedComponent:",
    selectedComponent,
    "selectedMetric:",
    selectedMetric
  );

  // Process simulation data for charts
  const { chartData, components, availableMetrics } = useMemo(() => {
    console.log("Raw simulationData:", simulationData);

    // Force mock data for testing - remove this later
    let dataToUse;

    // Always use mock data for now to test the interface
    console.log("FORCING mock data for testing");
    dataToUse = Array.from({ length: 100 }, (_, i) => ({
      timestep: i * 0.01,
      positions: {
        beam: [Math.sin(i * 0.1) * 0.5, 0, Math.cos(i * 0.1) * 0.2],
        support: [0, 0, 0],
      },
      orientations: {
        beam: [0, 0, i * 0.02],
        support: [0, 0, 0],
      },
      velocities: {
        beam: [Math.cos(i * 0.1) * 0.05, 0, -Math.sin(i * 0.1) * 0.02],
        support: [0, 0, 0],
      },
    }));

    console.log("Mock data created, length:", dataToUse.length);
    console.log("Mock data first frame:", dataToUse[0]);

    if (!dataToUse || dataToUse.length === 0) {
      return { chartData: [], components: [], availableMetrics: [] };
    }

    const components = new Set<string>();
    const metrics = new Set<string>();

    // Extract all component names and available metrics
    dataToUse.forEach((frame, index) => {
      if (index === 0) {
        console.log("Frame structure:", {
          positions: frame.positions,
          orientations: frame.orientations,
          velocities: frame.velocities,
          forces: frame.forces,
        });
      }

      Object.keys(frame.positions || {}).forEach((comp) =>
        components.add(comp)
      );
      Object.keys(frame.orientations || {}).forEach((comp) =>
        components.add(comp)
      );
      Object.keys(frame.velocities || {}).forEach((comp) =>
        components.add(comp)
      );
      Object.keys(frame.forces || {}).forEach((comp) => components.add(comp));
    });

    console.log("Detected components:", Array.from(components));

    if (
      dataToUse[0]?.positions &&
      Object.keys(dataToUse[0].positions).length > 0
    ) {
      metrics.add("position");
      console.log("Added position metric");
    }
    if (
      dataToUse[0]?.orientations &&
      Object.keys(dataToUse[0].orientations).length > 0
    ) {
      metrics.add("orientation");
      console.log("Added orientation metric");
    }
    if (
      dataToUse[0]?.velocities &&
      Object.keys(dataToUse[0].velocities).length > 0
    ) {
      metrics.add("velocity");
      console.log("Added velocity metric");
    }
    if (dataToUse[0]?.forces && Object.keys(dataToUse[0].forces).length > 0) {
      metrics.add("force");
      console.log("Added force metric");
    }

    console.log("Detected metrics:", Array.from(metrics));

    // Transform data for charts
    const chartData: ChartDataPoint[] = dataToUse.map((frame, index) => {
      const dataPoint: ChartDataPoint = {
        time: frame.timestep || index * 0.01, // fallback timestep
      };

      Array.from(components).forEach((component) => {
        // Always include position data if available
        if (frame.positions?.[component]) {
          const pos = frame.positions[component];
          dataPoint[`${component}_x`] = pos[0] || 0;
          dataPoint[`${component}_y`] = pos[1] || 0;
          dataPoint[`${component}_z`] = pos[2] || 0;
          dataPoint[`${component}_magnitude`] = Math.sqrt(
            (pos[0] || 0) ** 2 + (pos[1] || 0) ** 2 + (pos[2] || 0) ** 2
          );
        }

        // Always include orientation data if available
        if (frame.orientations?.[component]) {
          const rot = frame.orientations[component];
          dataPoint[`${component}_rx`] = rot[0] || 0;
          dataPoint[`${component}_ry`] = rot[1] || 0;
          dataPoint[`${component}_rz`] = rot[2] || 0;
        }

        // Always include velocity data if available
        if (frame.velocities?.[component]) {
          const vel = frame.velocities[component];
          dataPoint[`${component}_vx`] = vel[0] || 0;
          dataPoint[`${component}_vy`] = vel[1] || 0;
          dataPoint[`${component}_vz`] = vel[2] || 0;
          dataPoint[`${component}_speed`] = Math.sqrt(
            (vel[0] || 0) ** 2 + (vel[1] || 0) ** 2 + (vel[2] || 0) ** 2
          );
        }

        // Always include force data if available
        if (frame.forces?.[component]) {
          const force = frame.forces[component];
          dataPoint[`${component}_fx`] = force[0] || 0;
          dataPoint[`${component}_fy`] = force[1] || 0;
          dataPoint[`${component}_fz`] = force[2] || 0;
          dataPoint[`${component}_force_magnitude`] = Math.sqrt(
            (force[0] || 0) ** 2 + (force[1] || 0) ** 2 + (force[2] || 0) ** 2
          );
        }
      });

      return dataPoint;
    });

    console.log("Chart data processing:", {
      dataLength: dataToUse.length,
      components: Array.from(components),
      metrics: Array.from(metrics),
      sampleFrame: dataToUse[0],
      chartDataSample: chartData[0],
    });

    return {
      chartData,
      components: Array.from(components),
      availableMetrics: Array.from(metrics),
    };
  }, [simulationData]);

  // Auto-select first available metric if current selection is invalid
  useEffect(() => {
    if (
      availableMetrics.length > 0 &&
      !availableMetrics.includes(selectedMetric)
    ) {
      console.log(
        "Auto-selecting first available metric:",
        availableMetrics[0]
      );
      setSelectedMetric(availableMetrics[0]);
    }
  }, [availableMetrics, selectedMetric]);

  // Auto-select first component if current selection is invalid
  useEffect(() => {
    if (
      components.length > 0 &&
      selectedComponent !== "all" &&
      !components.includes(selectedComponent)
    ) {
      console.log('Auto-selecting "all" components');
      setSelectedComponent("all");
    }
  }, [components, selectedComponent]);

  // Generate colors for different components
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7c7c",
    "#8dd1e1",
    "#d084d0",
  ];

  // Show message only if we have no data AND no mock data is being used
  if (
    (!simulationData || simulationData.length === 0) &&
    chartData.length === 0
  ) {
    return (
      <Card withBorder p="md">
        <Group justify="center" align="center" h={200}>
          <Stack align="center" gap="sm">
            <IconAlertCircle size={48} color="gray" />
            <Text c="dimmed" ta="center">
              No simulation data available
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              Run a simulation to see charts and analysis
            </Text>
          </Stack>
        </Group>
      </Card>
    );
  }

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          label={{ value: "Time (s)", position: "insideBottom", offset: -10 }}
        />
        <YAxis
          label={{
            value:
              selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
            angle: -90,
            position: "insideLeft",
          }}
        />
        <Tooltip />
        <Legend />

        {components.map((component, index) => {
          if (selectedComponent !== "all" && selectedComponent !== component)
            return null;

          const color = colors[index % colors.length];

          console.log(
            "Rendering component:",
            component,
            "metric:",
            selectedMetric,
            "color:",
            color
          );

          if (selectedMetric === "position") {
            return (
              <React.Fragment key={component}>
                <Line
                  type="monotone"
                  dataKey={`${component}_x`}
                  stroke={color}
                  strokeWidth={2}
                  name={`${component} X`}
                />
                <Line
                  type="monotone"
                  dataKey={`${component}_y`}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={`${component} Y`}
                />
                <Line
                  type="monotone"
                  dataKey={`${component}_z`}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="10 5"
                  name={`${component} Z`}
                />
              </React.Fragment>
            );
          }

          if (selectedMetric === "velocity") {
            return (
              <Line
                key={component}
                type="monotone"
                dataKey={`${component}_speed`}
                stroke={color}
                strokeWidth={2}
                name={`${component} Speed`}
              />
            );
          }

          return (
            <Line
              key={component}
              type="monotone"
              dataKey={`${component}_magnitude`}
              stroke={color}
              strokeWidth={2}
              name={component}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />

        {components.map((component, index) => {
          if (selectedComponent !== "all" && selectedComponent !== component)
            return null;

          const color = colors[index % colors.length];
          const dataKey =
            selectedMetric === "velocity"
              ? `${component}_speed`
              : `${component}_magnitude`;

          return (
            <Area
              key={component}
              type="monotone"
              dataKey={dataKey}
              stackId="1"
              stroke={color}
              fill={color}
              fillOpacity={0.6}
              name={component}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          Simulation Results
        </Text>
        <Group gap="xs">
          {!simulationData && (
            <Badge variant="light" color="orange">
              Demo Data
            </Badge>
          )}
          {simulationId && (
            <Badge variant="light">ID: {simulationId.slice(0, 8)}...</Badge>
          )}
        </Group>
      </Group>

      <Group>
        <Select
          label="Component"
          value={selectedComponent}
          onChange={(value) => {
            console.log("Component changed to:", value);
            setSelectedComponent(value || "all");
          }}
          data={(() => {
            const componentData = [
              { value: "all", label: "All Components" },
              ...components.map((comp) => ({ value: comp, label: comp })),
            ];
            console.log("Component select data:", componentData);
            return componentData;
          })()}
          style={{ minWidth: 150 }}
          placeholder="Select component..."
          disabled={components.length === 0}
        />

        <Select
          label="Metric"
          value={selectedMetric}
          onChange={(value) => {
            console.log("Metric changed to:", value);
            setSelectedMetric(value || availableMetrics[0] || "position");
          }}
          data={(() => {
            const metricData =
              availableMetrics.length > 0
                ? availableMetrics.map((metric) => ({
                    value: metric,
                    label: metric.charAt(0).toUpperCase() + metric.slice(1),
                  }))
                : [{ value: "position", label: "Position" }]; // Fallback
            console.log("Metric select data:", metricData);
            return metricData;
          })()}
          style={{ minWidth: 120 }}
          placeholder="Select metric..."
          disabled={availableMetrics.length === 0}
        />
      </Group>

      {/* Debug info */}
      <Card withBorder p="sm" style={{ backgroundColor: "#f8f9fa" }}>
        <Text size="xs" c="dimmed">
          Debug: Components: {components.join(", ")} | Metrics:{" "}
          {availableMetrics.join(", ")} | Selected: {selectedComponent} /{" "}
          {selectedMetric} | Data points: {chartData.length}
        </Text>
        <Group gap="xs" mt="xs">
          <button
            onClick={() => setSelectedComponent("beam")}
            style={{ fontSize: "10px", padding: "2px 6px" }}
          >
            Select Beam
          </button>
          <button
            onClick={() => setSelectedMetric("velocity")}
            style={{ fontSize: "10px", padding: "2px 6px" }}
          >
            Select Velocity
          </button>
          <button
            onClick={() =>
              console.log("Current chart data:", chartData.slice(0, 3))
            }
            style={{ fontSize: "10px", padding: "2px 6px" }}
          >
            Log Chart Data
          </button>
        </Group>
      </Card>

      <Tabs defaultValue="line">
        <Tabs.List>
          <Tabs.Tab value="line" leftSection={<IconChartLine size={16} />}>
            Line Chart
          </Tabs.Tab>
          <Tabs.Tab value="area" leftSection={<IconChartArea size={16} />}>
            Area Chart
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="line" pt="md">
          <Card withBorder p="md">
            {renderLineChart()}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="area" pt="md">
          <Card withBorder p="md">
            {renderAreaChart()}
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Summary Statistics */}
      <Card withBorder p="md">
        <Text size="md" fw={500} mb="md">
          Summary
        </Text>
        <Grid>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">
              Total Frames
            </Text>
            <Text size="lg" fw={600}>
              {chartData.length}
            </Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">
              Duration
            </Text>
            <Text size="lg" fw={600}>
              {(chartData[chartData.length - 1]?.time || 0).toFixed(2)}s
            </Text>
          </Grid.Col>
        </Grid>
      </Card>
    </Stack>
  );
}

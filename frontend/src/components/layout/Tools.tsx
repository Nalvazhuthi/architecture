import React, { useState } from "react";
import {
  PolygonWall,
  RectangularWall,
  AddPointsIcon,
  Veranda,
  Door,
  Window,
} from "../../assets/images/svgExports";
import { useToolStore } from "../../store/store";

type ToolName = "RectangularWall" | "PolygonWall" | "AddPoint" | "Veranda" | "Door" | "Window";

interface SubTool {
  name: ToolName;
  icon: React.ReactNode;
  label: string;
}

interface Tool {
  name: ToolName | "3DView";
  icon: React.ReactNode;
  label: string;
  subTools?: SubTool[];
  action?: () => void;
}

const Tools: React.FC = () => {
  const { activeTool, setActiveTool, is3d, setIs3d } = useToolStore();

  const wallSubTools: SubTool[] = [
    { name: "RectangularWall", icon: <RectangularWall />, label: "Straight" },
    { name: "PolygonWall", icon: <PolygonWall />, label: "Custom" },
  ];

  const getWallLabelAndIcon = () => {
    const match = wallSubTools.find((s) => s.name === activeTool);
    return match || { icon: <RectangularWall />, label: "Wall" };
  };

  const tools: Tool[] = [
    {
      name: "RectangularWall", // main name for keying
      icon: getWallLabelAndIcon().icon,
      label: getWallLabelAndIcon().label,
      subTools: wallSubTools,
    },
    { name: "AddPoint", icon: <AddPointsIcon />, label: "Point" },
    { name: "Veranda", icon: <Veranda />, label: "Veranda" },
    { name: "Door", icon: <Door />, label: "Door" },
    { name: "Window", icon: <Window />, label: "Window" },
    {
      name: "3DView",
      icon: <span>3D</span>,
      label: is3d ? "2D View" : "3D View",
      action: () => setIs3d(!is3d),
    },
  ];

  const handleSetTool = (tool: ToolName) => {
    setActiveTool(tool);
  };

  return (
    <div className="tool-container">
      {tools.map((tool) => (
        <div key={tool.name} className="tool-group">
          <div
            className={`tool ${activeTool === tool.name || tool.subTools?.some(s => s.name === activeTool) ? "active" : ""} ${
              tool.name === "3DView" ? "view-toggle" : ""
            }`}
            onClick={tool.name === "3DView" ? tool.action : () => handleSetTool(tool.name as ToolName)}
            title={tool.label}
          >
            {tool.icon}
            <span className="tool-label">{tool.label}</span>

            {tool.subTools && (
              <div className="sub-tools">
                {tool.subTools.map((subTool) => (
                  <div
                    key={subTool.name}
                    className={`sub-tool ${activeTool === subTool.name ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetTool(subTool.name);
                    }}
                    title={subTool.label}
                  >
                    {subTool.icon}
                    <span>{subTool.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Tools;

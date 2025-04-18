import {
  PolygonWall,
  RectangularWall,
  AddPointsIcon,
  Veranda,
  Door,
  Window,
} from "../../assets/images/svgExports";
import React from "react";
import { useToolStore } from "../../store/store";

const Tools: React.FC = () => {
  const { activeTool, setActiveTool, is3d, setIs3d } = useToolStore();

  const handleSetTool = (tool: typeof activeTool) => {
    setActiveTool(tool);
  };

  return (
    <div className="tool-container">
      <div
        className={`tool ${activeTool === "RectangularWall" ? "active" : ""}`}
        onClick={() => handleSetTool("RectangularWall")}
      >
        <RectangularWall />
        <div className="dropps">
          <div onClick={() => handleSetTool("RectangularWall")}>
            <RectangularWall />
          </div>
          <div onClick={() => handleSetTool("PolygonWall")}>
            <PolygonWall />
          </div>
        </div>
      </div>

      <div
        className={`tool ${activeTool === "AddPoint" ? "active" : ""}`}
        onClick={() => handleSetTool("AddPoint")}
      >
        <AddPointsIcon />
      </div>

      <div
        className={`tool ${activeTool === "Veranda" ? "active" : ""}`}
        onClick={() => handleSetTool("Veranda")}
      >
        <Veranda />
      </div>

      <div
        className={`tool ${activeTool === "Door" ? "active" : ""}`}
        onClick={() => handleSetTool("Door")}
      >
        <Door />
      </div>

      <div
        className={`tool ${activeTool === "Window" ? "active" : ""}`}
        onClick={() => handleSetTool("Window")}
      >
        <Window />
      </div>

      <div className="tool" onClick={() => setIs3d(!is3d)}>
        Explore 3D
      </div>
    </div>
  );
};

export default Tools;

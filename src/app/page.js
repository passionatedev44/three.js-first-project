// src/app/page.js
import React from "react";
import ModelViewer from "./ModelViewer";

export default function Home() {
  return (
    <div>
      <h1
        style={{
          textAlign: "center",
          position: "absolute",
          width: "100%",
          top: "20px",
          color: "#333",
        }}
      >
        Welcome to Our Landing Page
      </h1>
      <ModelViewer />
    </div>
  );
}

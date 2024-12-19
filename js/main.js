"use strict";

import { parseMTL, parseOBJ } from "./parse.js";
import { vertexShaders, fragmentShaders } from "./shaders.js";
import { getGeometriesExtents, degToRad } from "./utils.js";

async function main() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const meshProgramInfo = webglUtils.createProgramInfo(gl, [
    vertexShaders,
    fragmentShaders,
  ]);

  const objHref = "./object/SandalHiu.obj";
  const response = await fetch(objHref);
  const text = await response.text();
  const obj = parseOBJ(text);

  const baseHref = new URL(objHref, window.location.href);
  const matTexts = await Promise.all(
    obj.materialLibs.map(async (filename) => {
      const matHref = new URL(filename, baseHref).href;
      const response = await fetch(matHref);
      return await response.text();
    })
  );
  const materials = parseMTL(matTexts.join("\n"));

  const defaultMaterial = {
    diffuse: [0.9, 0.9, 0.9],
    ambient: [0.7, 0.7, 0.7],
    specular: [1.0, 1.0, 1.0],
    shininess: 400,
    opacity: 1.0,
    emissive: [0.3, 0.3, 0.3],
  };

  const parts = obj.geometries.map(({ material, data }) => {
    if (!data.color) {
      data.color = { value: [1, 1, 1, 1] };
    }
    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
    return {
      material: materials[material] || defaultMaterial,
      bufferInfo,
    };
  });

  const extents = getGeometriesExtents(obj.geometries);
  const range = m4.subtractVectors(extents.max, extents.min);
  const objOffset = m4.scaleVector(
    m4.addVectors(extents.min, m4.scaleVector(range, 0.5)),
    -1
  );

  const cameraTarget = [0, 0, 0];
  let radius = m4.length(range) * 0.7;
  let cameraAngleX = 0;
  let cameraAngleY = 0;

  const zNear = radius / 100;
  const zFar = radius * 3;

  const minZoom = m4.length(range) * 0.3;
  const maxZoom = m4.length(range) * 1.5;

  const maxVerticalAngle = Math.PI / 2.1;
  const minVerticalAngle = -Math.PI / 2.1;

  const defaultState = {
    radius: radius,
    cameraAngleX: 0,
    cameraAngleY: 0,
  };

  let isDragging = false;
  let lastMousePos = { x: 0, y: 0 };

  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;

      cameraAngleY -= dx * 0.01;

      cameraAngleX += dy * 0.01;
      cameraAngleX = Math.max(
        minVerticalAngle,
        Math.min(maxVerticalAngle, cameraAngleX)
      );

      lastMousePos = { x: e.clientX, y: e.clientY };
    }
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });

  canvas.addEventListener("wheel", (e) => {
    radius *= e.deltaY > 0 ? 1.1 : 0.9;

    if (radius < minZoom) radius = minZoom;
    if (radius > maxZoom) radius = maxZoom;

    e.preventDefault();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    radius = defaultState.radius;
    cameraAngleX = defaultState.cameraAngleX;
    cameraAngleY = defaultState.cameraAngleY;
  });

  function render() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const cameraPosition = [
      radius * Math.sin(cameraAngleY) * Math.cos(cameraAngleX),
      radius * Math.sin(cameraAngleX),
      radius * Math.cos(cameraAngleY) * Math.cos(cameraAngleX),
    ];

    const up = [0, 1, 0];
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([0, 2, 2]),
      u_ambientLight: [0.3, 0.3, 0.3],
      u_view: view,
      u_projection: projection,
      u_viewWorldPosition: cameraPosition,
    };

    gl.useProgram(meshProgramInfo.program);
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    let u_world = m4.translate(m4.identity(), ...objOffset);
    for (const { bufferInfo, material } of parts) {
      webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
      webglUtils.setUniforms(meshProgramInfo, { u_world }, material);
      webglUtils.drawBufferInfo(gl, bufferInfo);
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();

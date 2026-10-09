import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import jpeg from "jpeg-js";
import { interviewerAvatars } from "../src/data/interview-avatars.js";
import { createInterviewerAvatar } from "../src/components/interviewer-avatar-factory.js";

globalThis.FileReader = class NodeFileReader {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outputDirectory = path.join(projectRoot, "public", "avatars");
const sphereGeometry = new THREE.SphereGeometry(1, 24, 16);

function createNeutralTexture() {
  const width = 256;
  const height = 256;
  const data = new Uint8Array(width * height * 4);
  let seed = 13641;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const fineNoise = (seed >>> 24) % 7 - 3;
      const wave = Math.sin((x + y * 0.4) * 0.055) * 1.4;
      const value = Math.max(0, Math.min(255, Math.round(247 + fineNoise + wave)));
      const offset = (y * width + x) * 4;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  return jpeg.encode({ data, width, height }, 68).data;
}

function appendCompressedTexture(glbData, jpegBytes) {
  const dataView = new DataView(glbData);
  const jsonLength = dataView.getUint32(12, true);
  const jsonStart = 20;
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(glbData, jsonStart, jsonLength)).trim());
  const binaryPrefix = jsonStart + jsonLength;
  const binaryLength = dataView.getUint32(binaryPrefix, true);
  const binaryStart = binaryPrefix + 8;
  const binary = new Uint8Array(glbData, binaryStart, binaryLength);
  const imageOffset = Math.ceil(binary.byteLength / 4) * 4;
  const paddedImageLength = Math.ceil(jpegBytes.byteLength / 4) * 4;
  const combinedBinary = new Uint8Array(imageOffset + paddedImageLength);
  combinedBinary.set(binary);
  combinedBinary.set(jpegBytes, imageOffset);

  json.buffers[0].byteLength = combinedBinary.byteLength;
  json.bufferViews ||= [];
  const imageViewIndex = json.bufferViews.length;
  json.bufferViews.push({
    buffer: 0,
    byteOffset: imageOffset,
    byteLength: jpegBytes.byteLength,
  });
  json.images = [{ name: "Subtle_Surface_Detail", bufferView: imageViewIndex, mimeType: "image/jpeg" }];
  json.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
  json.textures = [{ sampler: 0, source: 0 }];
  for (const item of json.materials || []) {
    item.pbrMetallicRoughness.baseColorTexture = { index: 0 };
  }

  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const paddedJsonLength = Math.ceil(jsonBytes.byteLength / 4) * 4;
  const totalLength = 12 + 8 + paddedJsonLength + 8 + combinedBinary.byteLength;
  const output = new ArrayBuffer(totalLength);
  const outputView = new DataView(output);
  outputView.setUint32(0, 0x46546c67, true);
  outputView.setUint32(4, 2, true);
  outputView.setUint32(8, totalLength, true);
  outputView.setUint32(12, paddedJsonLength, true);
  outputView.setUint32(16, 0x4e4f534a, true);
  const outputBytes = new Uint8Array(output);
  outputBytes.set(jsonBytes, 20);
  outputBytes.fill(0x20, 20 + jsonBytes.byteLength, 20 + paddedJsonLength);
  const outputBinaryPrefix = 20 + paddedJsonLength;
  outputView.setUint32(outputBinaryPrefix, combinedBinary.byteLength, true);
  outputView.setUint32(outputBinaryPrefix + 4, 0x004e4942, true);
  outputBytes.set(combinedBinary, outputBinaryPrefix + 8);
  return output;
}

function createIdleAnimation(head, body) {
  const times = [0, 1.5, 3];
  const first = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.015, 0));
  const middle = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.012, 0.02, 0));
  const last = new THREE.Quaternion().copy(first);
  const headTrack = new THREE.QuaternionKeyframeTrack(
    `${head.name}.quaternion`,
    times,
    [...first.toArray(), ...middle.toArray(), ...last.toArray()],
  );
  const bodyTrack = new THREE.VectorKeyframeTrack(
    `${body.name}.scale`,
    times,
    [1, 1, 1, 1, 1.006, 1, 1, 1, 1],
  );
  return new THREE.AnimationClip("Idle", 3, [headTrack, bodyTrack]);
}

await fs.mkdir(outputDirectory, { recursive: true });
const compressedTexture = createNeutralTexture();

for (const profile of interviewerAvatars) {
  const scene = new THREE.Scene();
  const avatar = createInterviewerAvatar(profile, sphereGeometry);
  scene.add(avatar.root);
  const idle = createIdleAnimation(avatar.head, avatar.body);
  const rawGlb = await new GLTFExporter().parseAsync(scene, {
    binary: true,
    animations: [idle],
  });
  const glb = appendCompressedTexture(rawGlb, compressedTexture);
  const outputPath = path.join(outputDirectory, `${profile.id}.glb`);
  await fs.writeFile(outputPath, new Uint8Array(glb));
  console.log(`${profile.id}: ${(glb.byteLength / (1024 * 1024)).toFixed(2)} MB`);
}

sphereGeometry.dispose();

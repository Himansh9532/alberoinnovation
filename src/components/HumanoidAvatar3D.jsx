import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getInterviewerAvatar } from "../data/interview-avatars";

const loader = new GLTFLoader();
const avatarCache = new Map();

function loadAvatar(id, modelUrl) {
  if (!avatarCache.has(id)) {
    const request = loader.loadAsync(modelUrl).catch((error) => {
      avatarCache.delete(id);
      throw error;
    });
    avatarCache.set(id, request);
  }
  return avatarCache.get(id);
}

export default function HumanoidAvatar3D({ speaking, speechMouthLevel = 0, avatarId }) {
  const hostRef = useRef(null);
  const speakingRef = useRef(speaking);
  const speechMouthLevelRef = useRef(speechMouthLevel);
  const [status, setStatus] = useState("loading");
  const profile = getInterviewerAvatar(avatarId);

  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);

  useEffect(() => {
    speechMouthLevelRef.current = speechMouthLevel;
  }, [speechMouthLevel]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !profile) return undefined;

    let renderer;
    let animationFrame;
    let avatarRoot;
    let mixer;
    let mouthMeshes = [];
    let blinkMeshes = [];
    let mouthGroup;
    let mouthOpening;
    let lowerLip;
    let mouthOpeningBaseScaleY = 0;
    let lowerLipBaseY = 0;
    let alive = true;
    let blinkUntil = 0;
    let nextBlink = 1.5 + Math.random() * 2.5;
    const timer = new THREE.Timer();
    timer.connect(document);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0.05, 7.8);

    scene.add(new THREE.HemisphereLight("#ffffff", "#8c786a", 2.2));
    const keyLight = new THREE.DirectionalLight("#fff2df", 3.2);
    keyLight.position.set(-3, 4.5, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight("#bfd6ff", 1.8);
    fillLight.position.set(3, 1.4, 3);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight("#ecc7aa", 2.2);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = "humanoid-avatar-canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.appendChild(renderer.domElement);
    } catch (error) {
      console.error("The 3D interviewer could not start WebGL:", error);
      setStatus("unavailable");
      return undefined;
    }

    const resize = (width, height) => {
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(([entry]) => {
      resize(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(host);
    const initialBounds = host.getBoundingClientRect();
    resize(initialBounds.width, initialBounds.height);

    const animate = (timestamp) => {
      animationFrame = window.requestAnimationFrame(animate);
      timer.update(timestamp);
      const delta = timer.getDelta();
      const elapsed = timer.getElapsed();
      const now = elapsed;
      if (now >= nextBlink && !blinkUntil) blinkUntil = now + 0.14;
      if (blinkUntil && now >= blinkUntil) {
        blinkUntil = 0;
        nextBlink = now + 1.8 + Math.random() * 3.2;
      }

      const blink = blinkUntil ? 1 : 0;
      const syllablePulse = Math.pow(Math.max(0, Math.sin(elapsed * 23)), 1.15);
      const speechLevel = speechMouthLevelRef.current < 0 ? 0.62 : speechMouthLevelRef.current;
      const mouthTarget = speechLevel * (0.08 + 0.92 * syllablePulse);
      const mouthOpen = speakingRef.current ? mouthTarget : 0;
      for (const mesh of mouthMeshes) {
        const index = mesh.morphTargetDictionary?.mouthOpen;
        if (index !== undefined) mesh.morphTargetInfluences[index] = THREE.MathUtils.damp(mesh.morphTargetInfluences[index], mouthOpen, 14, delta);
      }
      for (const mesh of blinkMeshes) {
        const left = mesh.morphTargetDictionary?.blinkLeft;
        const right = mesh.morphTargetDictionary?.blinkRight;
        if (left !== undefined) mesh.morphTargetInfluences[left] = blink;
        if (right !== undefined) mesh.morphTargetInfluences[right] = blink;
      }
      if (mouthGroup) {
        const talk = speakingRef.current ? mouthTarget : 0;
        mouthGroup.scale.y = THREE.MathUtils.damp(mouthGroup.scale.y, 1 + talk * 0.55, 18, delta);
      }
      if (mouthOpening) {
        const talk = speakingRef.current ? mouthTarget : 0;
        mouthOpening.scale.y = THREE.MathUtils.damp(
          mouthOpening.scale.y,
          mouthOpeningBaseScaleY * (1 + talk * 4.5),
          22,
          delta,
        );
      }
      if (lowerLip) {
        const talk = speakingRef.current ? mouthTarget : 0;
        lowerLip.position.y = THREE.MathUtils.damp(lowerLip.position.y, lowerLipBaseY - talk * 0.025, 18, delta);
      }
      if (avatarRoot) {
        avatarRoot.rotation.y = Math.sin(elapsed * 0.55) * 0.025;
        avatarRoot.position.y = Math.sin(elapsed * 1.5) * 0.018;
        if (mixer) mixer.update(delta);
      }
      renderer.render(scene, camera);
    };
    animate();

    setStatus("loading");
    loadAvatar(profile.id, profile.modelUrl)
      .then((gltf) => {
        if (!alive) return;
        avatarRoot = gltf.scene.clone(true);
        avatarRoot.scale.setScalar(0.96);
        avatarRoot.traverse((object) => {
          if (!object.isMesh) return;
          object.frustumCulled = false;
          if (object.morphTargetDictionary?.mouthOpen !== undefined) mouthMeshes.push(object);
          if (object.morphTargetDictionary?.blinkLeft !== undefined) blinkMeshes.push(object);
          if (object.name === "MouthAnimation") mouthGroup = object;
          if (object.name === "MouthOpening") {
            mouthOpening = object;
            mouthOpeningBaseScaleY = object.scale.y;
          }
          if (object.name === "LowerLip") {
            lowerLip = object;
            lowerLipBaseY = object.position.y;
          }
        });
        scene.add(avatarRoot);
        mixer = new THREE.AnimationMixer(avatarRoot);
        const idleAnimation = gltf.animations.find((clip) => clip.name === "Idle");
        if (idleAnimation) mixer.clipAction(idleAnimation).play();
        setStatus("ready");
      })
      .catch((error) => {
        if (!alive) return;
        console.error(`The ${profile.name} 3D interviewer could not be loaded:`, error);
        setStatus("unavailable");
      });

    return () => {
      alive = false;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      if (mixer) mixer.stopAllAction();
      if (avatarRoot) scene.remove(avatarRoot);
      timer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [profile]);

  return (
    <div className="humanoid-avatar-stage" ref={hostRef} data-avatar-status={status}>
      {status !== "ready" && (
        <span className="humanoid-avatar-message">
          {status === "unavailable" ? "3D interviewer could not be loaded." : "Loading 3D interviewer..."}
        </span>
      )}
    </div>
  );
}

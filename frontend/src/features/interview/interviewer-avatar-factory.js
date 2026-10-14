import * as THREE from "three";

function material(color, roughness = 0.72, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function ellipsoid(parent, geometry, colorMaterial, position, scale) {
  const mesh = new THREE.Mesh(geometry, colorMaterial);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

function tube(parent, points, radius, colorMaterial) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, radius, 8, false), colorMaterial);
  parent.add(mesh);
  return mesh;
}

function makeFaceGeometry(sphereGeometry) {
  const geometry = sphereGeometry.clone();
  const base = geometry.attributes.position;
  const mouthOpen = base.array.slice();
  const blinkLeft = base.array.slice();
  const blinkRight = base.array.slice();

  for (let index = 0; index < base.count; index += 1) {
    const x = base.getX(index);
    const y = base.getY(index);
    const z = base.getZ(index);
    const mouthWeight = Math.exp(-((x / 0.38) ** 2) - (((y + 0.43) / 0.28) ** 2)) * Math.max(0, (z - 0.25) / 0.75);
    mouthOpen[index * 3 + 1] -= mouthWeight * 0.24;

    for (const [target, centerX] of [[blinkLeft, -0.36], [blinkRight, 0.36]]) {
      const eyeWeight = Math.exp(-(((x - centerX) / 0.19) ** 2) - (((y - 0.12) / 0.11) ** 2)) * Math.max(0, (z - 0.5) / 0.5);
      target[index * 3 + 1] -= eyeWeight * 0.08;
    }
  }

  geometry.morphAttributes.position = [
    new THREE.Float32BufferAttribute(mouthOpen, 3),
    new THREE.Float32BufferAttribute(blinkLeft, 3),
    new THREE.Float32BufferAttribute(blinkRight, 3),
  ];
  geometry.userData.targetNames = ["mouthOpen", "blinkLeft", "blinkRight"];
  return geometry;
}

export function createInterviewerAvatar(profile, sphereGeometry) {
  const look = profile;
  const gender = profile.gender;
  const root = new THREE.Group();
  const head = new THREE.Group();
  const body = new THREE.Group();
  const eyes = [];

  const skin = material(look.skin, 0.82);
  const skinShadow = material(look.shadow, 0.86);
  const hair = material(look.hair, 0.79);
  const hairHighlight = material(look.hairLight, 0.74);
  const jacket = material(look.jacket, 0.9);
  const shirt = material(look.shirt, 0.94);
  const eyeWhite = material("#fffaf2", 0.3);
  const iris = material(look.iris, 0.38);
  const pupil = material("#171716", 0.24);
  const brow = material(look.hair, 0.88);
  const lip = material(look.lips, 0.65);
  const lipLight = material("#d68177", 0.62);
  const dark = material("#312624", 0.9);

  root.name = "Interviewer";
  head.name = "Head";
  body.name = "Body";
  root.add(body, head);
  body.position.y = -0.92;
  head.position.set(0, 0.92, 0);

  ellipsoid(body, sphereGeometry, jacket, [0, -0.35, 0], [1.09, 1.03, 0.53]);
  ellipsoid(body, sphereGeometry, jacket, [-0.68, 0.12, -0.02], [0.48, 0.48, 0.5]);
  ellipsoid(body, sphereGeometry, jacket, [0.68, 0.12, -0.02], [0.48, 0.48, 0.5]);
  ellipsoid(body, sphereGeometry, shirt, [0, -0.18, 0.45], [0.49, 0.72, 0.17]);
  ellipsoid(body, sphereGeometry, skin, [0, 0.7, 0.02], [0.25, 0.48, 0.25]);

  const lapelGeometry = new THREE.ConeGeometry(0.28, 1.02, 4);
  const lapelLeft = new THREE.Mesh(lapelGeometry, material(look.jacket, 0.84));
  lapelLeft.position.set(-0.3, 0.17, 0.54);
  lapelLeft.rotation.z = -0.36;
  lapelLeft.rotation.x = -Math.PI / 2;
  body.add(lapelLeft);
  const lapelRight = lapelLeft.clone();
  lapelRight.position.x = 0.3;
  lapelRight.rotation.z = 0.36;
  body.add(lapelRight);

  const face = new THREE.Mesh(makeFaceGeometry(sphereGeometry), skin);
  face.name = "Face";
  face.position.set(0, 0, 0);
  face.scale.set(0.68, 0.91, 0.56);
  face.updateMorphTargets();
  face.morphTargetDictionary = { mouthOpen: 0, blinkLeft: 1, blinkRight: 2 };
  head.add(face);

  for (const side of [-1, 1]) {
    ellipsoid(head, sphereGeometry, skin, [side * 0.65, -0.08, -0.005], [0.15, 0.22, 0.12]);
    ellipsoid(head, sphereGeometry, skinShadow, [side * 0.68, -0.07, 0.09], [0.068, 0.12, 0.045]);
    const eye = new THREE.Group();
    eye.position.set(side * 0.245, 0.11, 0.465);
    ellipsoid(eye, sphereGeometry, eyeWhite, [0, 0, 0], [0.108, 0.073, 0.055]);
    ellipsoid(eye, sphereGeometry, iris, [side * 0.006, 0, 0.047], [0.049, 0.052, 0.019]);
    ellipsoid(eye, sphereGeometry, pupil, [side * 0.006, 0, 0.061], [0.024, 0.032, 0.011]);
    ellipsoid(eye, sphereGeometry, material("#ffffff", 0.2), [-0.012, 0.018, 0.071], [0.009, 0.009, 0.006]);
    head.add(eye);
    eyes.push(eye);
    tube(head, [
      [side * 0.37, 0.255, 0.458],
      [side * 0.25, 0.29, 0.482],
      [side * 0.13, 0.255, 0.472],
    ], 0.033, brow);
  }

  ellipsoid(head, sphereGeometry, skin, [0, -0.035, 0.515], [0.085, 0.23, 0.085]);
  ellipsoid(head, sphereGeometry, skin, [0, -0.205, 0.566], [0.13, 0.095, 0.105]);
  ellipsoid(head, sphereGeometry, skinShadow, [-0.065, -0.245, 0.55], [0.029, 0.018, 0.018]);
  ellipsoid(head, sphereGeometry, skinShadow, [0.065, -0.245, 0.55], [0.029, 0.018, 0.018]);
  const mouth = new THREE.Group();
  mouth.name = "MouthAnimation";
  mouth.position.set(0, -0.405, 0.515);
  const upperLip = ellipsoid(mouth, sphereGeometry, lip, [0, 0.02, 0], [0.15, 0.047, 0.035]);
  upperLip.name = "UpperLip";
  const lowerLip = ellipsoid(mouth, sphereGeometry, lipLight, [0, -0.025, 0.005], [0.125, 0.035, 0.031]);
  lowerLip.name = "LowerLip";
  const mouthOpening = ellipsoid(mouth, sphereGeometry, dark, [0, -0.002, 0.03], [0.105, 0.012, 0.012]);
  mouthOpening.name = "MouthOpening";
  head.add(mouth);

  if (profile.hairStyle === "long") {
    ellipsoid(head, sphereGeometry, hair, [0, -0.09, -0.14], [0.73, 0.86, 0.53]);
    ellipsoid(head, sphereGeometry, hair, [0, 0.53, -0.035], [0.69, 0.39, 0.58]);
    for (const side of [-1, 1]) {
      ellipsoid(head, sphereGeometry, hair, [side * 0.56, -0.12, 0.03], [0.18, 0.75, 0.32]);
      ellipsoid(head, sphereGeometry, hairHighlight, [side * 0.59, -0.27, 0.27], [0.035, 0.47, 0.045]);
    }
    tube(head, [[-0.48, 0.46, 0.35], [-0.32, 0.63, 0.44], [-0.08, 0.64, 0.47], [0.02, 0.46, 0.5]], 0.07, hair);
    tube(head, [[0.48, 0.46, 0.35], [0.32, 0.63, 0.44], [0.08, 0.64, 0.47], [-0.02, 0.46, 0.5]], 0.07, hair);
  } else if (profile.hairStyle === "bob") {
    ellipsoid(head, sphereGeometry, hair, [0, -0.04, -0.13], [0.73, 0.67, 0.55]);
    ellipsoid(head, sphereGeometry, hair, [0, 0.53, -0.035], [0.69, 0.39, 0.58]);
    for (const side of [-1, 1]) {
      ellipsoid(head, sphereGeometry, hair, [side * 0.59, -0.15, 0.06], [0.15, 0.56, 0.3]);
      ellipsoid(head, sphereGeometry, hairHighlight, [side * 0.61, -0.24, 0.27], [0.03, 0.35, 0.04]);
    }
    tube(head, [[-0.48, 0.46, 0.35], [-0.28, 0.65, 0.44], [0.08, 0.58, 0.5], [0.22, 0.38, 0.5]], 0.065, hair);
  } else if (profile.hairStyle === "curly") {
    ellipsoid(head, sphereGeometry, hair, [0, -0.07, -0.13], [0.75, 0.83, 0.55]);
    for (let index = 0; index < 15; index += 1) {
      const angle = (index / 15) * Math.PI * 2;
      const x = Math.cos(angle) * 0.53;
      const z = Math.sin(angle) * 0.32;
      ellipsoid(head, sphereGeometry, index % 3 === 0 ? hairHighlight : hair, [x, 0.39 + Math.sin(index * 2) * 0.11, z], [0.18, 0.19, 0.17]);
    }
    for (const side of [-1, 1]) {
      ellipsoid(head, sphereGeometry, hair, [side * 0.6, -0.04, 0.02], [0.19, 0.64, 0.32]);
    }
  } else {
    ellipsoid(head, sphereGeometry, hair, [0, 0.56, -0.035], [0.69, 0.38, 0.58]);
    ellipsoid(head, sphereGeometry, hair, [-0.53, 0.32, 0.02], [0.15, 0.3, 0.3]);
    ellipsoid(head, sphereGeometry, hair, [0.53, 0.32, 0.02], [0.15, 0.3, 0.3]);
    for (let index = 0; index < 5; index += 1) {
      const offset = (index - 2) * 0.13;
      tube(head, [[offset - 0.12, 0.61, 0.35], [offset, 0.77 + (index % 2) * 0.035, 0.33], [offset + 0.12, 0.69, 0.4]], 0.035, index % 2 ? hair : hairHighlight);
    }
    if (profile.hairStyle === "parted") {
      tube(head, [[-0.2, 0.72, 0.36], [0.02, 0.79, 0.33], [0.25, 0.7, 0.38]], 0.04, hairHighlight);
    }
  }

  const clothingAccent = material(look.accent, 0.72, 0.18);
  ellipsoid(body, sphereGeometry, clothingAccent, [0, -0.17, 0.625], [0.045, 0.045, 0.026]);
  body.traverse((object) => {
    if (object.isMesh) object.castShadow = true;
  });
  head.traverse((object) => {
    if (object.isMesh) object.castShadow = true;
  });

  return { root, head, body, eyes, mouth, face };
}

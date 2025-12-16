import { loadAudio } from "/FYP/libs/loader.js";
import { DRACOLoader } from "/FYP/libs/three.js-r132/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "/FYP/libs/three.js-r132/examples/jsm/loaders/GLTFLoader.js";

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    try {

      /* ===========================================================
         BACK BUTTON
      ============================================================ */
      const backBtn = document.createElement("a");
      backBtn.innerHTML = `<img src="/FYP/image-menu/back.png" style="width:100%">`;
      backBtn.onclick = () => window.location.href = "/FYP/tongkitarsemula.html";
      Object.assign(backBtn.style, {
        position: "fixed",
        top: "12px",
        left: "12px",
        width: "90px",
        zIndex: "9999"
      });
      document.body.appendChild(backBtn);

      /* ===========================================================
         INFO BUTTON
      ============================================================ */
      const infoBtn = document.createElement("div");
      infoBtn.innerHTML = "💡";
      Object.assign(infoBtn.style, {
        position: "fixed",
        top: "12px",
        right: "16px",
        fontSize: "48px",
        zIndex: "9999",
        userSelect: "none",
        cursor: "pointer"
      });
      document.body.appendChild(infoBtn);

      /* ===========================================================
         INFO POPUP (SAFE FOR MOBILE)
      ============================================================ */
      const infoText = document.createElement("div");
      Object.assign(infoText.style, {
        position: "fixed",
        bottom: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "92%",
        padding: "14px 20px",
        background: "#8cd878",
        border: "3px solid #5faa48",
        borderRadius: "22px",
        fontSize: "clamp(14px,3.5vw,20px)",
        fontWeight: "bold",
        textAlign: "center",
        display: "none",
        opacity: "0",
        transition: "0.25s",
        zIndex: "9999",
        pointerEvents: "none"
      });
      document.body.appendChild(infoText);

      let infoShown = false;
      infoBtn.onclick = () => {
        infoShown = !infoShown;
        if (infoShown) {
          infoText.style.display = "block";
          setTimeout(() => infoText.style.opacity = "1", 10);
        } else {
          infoText.style.opacity = "0";
          setTimeout(() => infoText.style.display = "none", 250);
        }
      };

      /* ===========================================================
         MINDAR INIT
      ============================================================ */
      const mindarThree = new window.MINDAR.IMAGE.MindARThree({
        container: document.body,
        imageTargetSrc: "/FYP/assets/targets/tongkitar/tongbiru3.mind"
      });

      const { renderer, scene, camera } = mindarThree;
      scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

      /* ===========================================================
         LOADERS
      ============================================================ */
      const dLoader = new DRACOLoader();
      dLoader.setDecoderPath("/FYP/libs/draco/");
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dLoader);

      /* ===========================================================
         TARGET DATA
      ============================================================ */
      const targets = [
        {
          glb: "/FYP/assets/models/Mtongkitar/kertasmain.glb",
          audio: "/FYP/assets/suara/Stongkitar/tbiru1.mp3",
          scale: 0.2,
          info: "Tong biru sesuai untuk sampah jenis kertas"
        },
        {
          glb: "/FYP/assets/models/Mtongkitar/kertas1.glb",
          audio: "/FYP/assets/suara/Stongkitar/tbiru2.mp3",
          scale: 0.2,
          info: "Bahan kertas yang boleh dikitar semula adalah seperti surat khabar,kotak, dan sampul surat ."
        },
        {
          glb: "/FYP/assets/models/Mtongkitar/kertas2.glb",
          audio: "/FYP/assets/suara/Stongkitar/tbiru3.mp3",
          scale: 0.18,
          info: "Bahan kertas yang tidak boleh dikitar semula adalah seperti cawan kertas, kotak berminyak, dan nota lekat(sticky note)."
        }
      ];

      const mixers = [];
      const listener = new THREE.AudioListener();
      camera.add(listener);

      /* ===========================================================
         AUDIO UNLOCK (MOBILE REQUIRED)
      ============================================================ */
      document.addEventListener("touchstart", () => {
        const ctx = THREE.AudioContext.getContext();
        if (ctx.state === "suspended") ctx.resume();
      }, { once: true });

      /* ===========================================================
         LOAD TARGETS
      ============================================================ */
      for (let i = 0; i < targets.length; i++) {
        const anchor = mindarThree.addAnchor(i);

        const gltf = await new Promise(res =>
          gltfLoader.load(targets[i].glb, res)
        );

        gltf.scene.scale.setScalar(targets[i].scale);
        anchor.group.add(gltf.scene);
        targets[i].model = gltf.scene;

        const mixer = new THREE.AnimationMixer(gltf.scene);
        if (gltf.animations.length) {
          mixer.clipAction(gltf.animations[0]).play();
        }
        mixers.push(mixer);

        const buffer = await loadAudio(targets[i].audio);
        const audio = new THREE.PositionalAudio(listener);
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.setRefDistance(999999);
        anchor.group.add(audio);
        targets[i].audio = audio;

        anchor.onTargetFound = () => {
          targets[i].active = true;
          infoText.innerText = targets[i].info;
          targets.forEach((t, idx) => idx !== i && t.audio?.pause());
        };

        anchor.onTargetLost = () => {
          targets[i].active = false;
          audio.pause();
        };
      }

      /* ===========================================================
         TAP vs DRAG SYSTEM (IMPORTANT)
      ============================================================ */
      let dragging = false;
      let dragDist = 0;
      let sx = 0, sy = 0;
      const TAP_THRESHOLD = 8;

      const rotate = (dx, dy) => {
        targets.forEach(t => {
          if (t.active && t.model) {
            t.model.rotation.y += dx * 0.01;
            t.model.rotation.x += dy * 0.01;
          }
        });
      };

      const tryTap = (x, y) => {
        const mouse = new THREE.Vector2(
          (x / window.innerWidth) * 2 - 1,
          -(y / window.innerHeight) * 2 + 1
        );
        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);

        const idx = targets.findIndex(t => t.active);
        if (idx === -1) return;

        const hits = ray.intersectObjects(
          mindarThree.anchors[idx].group.children,
          true
        );

        if (hits.length) {
          const a = targets[idx].audio;
          a.isPlaying ? a.pause() : a.play();
        }
      };

      /* DESKTOP */
      document.addEventListener("mousedown", e => {
        dragging = true; dragDist = 0;
        sx = e.clientX; sy = e.clientY;
      });

      document.addEventListener("mousemove", e => {
        if (!dragging) return;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        dragDist += Math.abs(dx) + Math.abs(dy);
        rotate(dx, dy);
        sx = e.clientX; sy = e.clientY;
      });

      document.addEventListener("mouseup", e => {
        if (dragDist < TAP_THRESHOLD) tryTap(e.clientX, e.clientY);
        dragging = false;
      });

      /* MOBILE */
      document.addEventListener("touchstart", e => {
        dragging = true; dragDist = 0;
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
      });

      document.addEventListener("touchmove", e => {
        if (!dragging) return;
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const dx = x - sx;
        const dy = y - sy;
        dragDist += Math.abs(dx) + Math.abs(dy);
        rotate(dx, dy);
        sx = x; sy = y;
      });

      document.addEventListener("touchend", e => {
        if (dragDist < TAP_THRESHOLD) {
          const t = e.changedTouches[0];
          tryTap(t.clientX, t.clientY);
        }
        dragging = false;
      });

      /* ===========================================================
         START
      ============================================================ */
      await mindarThree.start();
      const clock = new THREE.Clock();

      renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();
        mixers.forEach(m => m.update(delta));
        renderer.render(scene, camera);
      });

    } catch (err) {
      console.error(err);
    }
  };

  start();
});

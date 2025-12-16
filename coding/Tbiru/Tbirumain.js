import { loadAudio } from "/FYP/libs/loader.js";
import { DRACOLoader } from "/FYP/libs/three.js-r132/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "/FYP/libs/three.js-r132/examples/jsm/loaders/GLTFLoader.js";

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    try {

      /* ===========================================================
         GLOBAL STATE (WAJIB ATAS SEKALI)
      ============================================================ */
      let isDragging = false;
      let prevX = 0;
      let prevY = 0;
      let audioUnlocked = false;

      /* ===========================================================
         BACK BUTTON
      ============================================================ */
      const backBtn = document.createElement("a");
      backBtn.innerHTML = `<img src="/FYP/image-menu/back.png" style="width:100%">`;
      backBtn.onclick = () => location.href = "/FYP/tongkitarsemula.html";
      Object.assign(backBtn.style, {
        position: "fixed",
        top: "clamp(10px,3vw,20px)",
        left: "clamp(10px,3vw,20px)",
        width: "clamp(70px,12vw,110px)",
        zIndex: 9999
      });
      document.body.appendChild(backBtn);

      /* ===========================================================
         INFO BUTTON + POPUP
      ============================================================ */
      const infoBtn = document.createElement("div");
      infoBtn.innerHTML = "💡";
      Object.assign(infoBtn.style, {
        position: "fixed",
        top: "10px",
        right: "20px",
        fontSize: "clamp(32px,8vw,48px)",
        cursor: "pointer",
        zIndex: 9999,
        userSelect: "none"
      });
      document.body.appendChild(infoBtn);

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
        color: "#1e4d14",
        fontSize: "clamp(14px,3.5vw,22px)",
        fontWeight: "bold",
        borderRadius: "22px",
        boxShadow: "0 8px 18px rgba(80,150,90,.3)",
        display: "none",
        opacity: 0,
        pointerEvents: "none",
        transition: "all .25s ease",
        zIndex: 9999
      });
      document.body.appendChild(infoText);

      let infoShown = false;
      infoBtn.onclick = () => {
        infoShown = !infoShown;
        infoText.style.display = infoShown ? "block" : "none";
        setTimeout(() => infoText.style.opacity = infoShown ? 1 : 0, 10);
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
          info: "Kertas boleh kitar semula seperti surat khabar & kotak"
        },
        {
          glb: "/FYP/assets/models/Mtongkitar/kertas2.glb",
          audio: "/FYP/assets/suara/Stongkitar/tbiru3.mp3",
          scale: 0.18,
          info: "Kertas berminyak & cawan kertas tidak boleh dikitar"
        }
      ];

      const mixers = [];
      const listener = new THREE.AudioListener();
      camera.add(listener);

      /* ===========================================================
         AUDIO UNLOCK (MOBILE SAFE)
      ============================================================ */
      const unlockAudio = () => {
        if (audioUnlocked) return;
        const ctx = THREE.AudioContext.getContext();
        if (ctx.state === "suspended") ctx.resume();
        audioUnlocked = true;
      };
      document.addEventListener("touchstart", unlockAudio, { once: true });
      document.addEventListener("click", unlockAudio, { once: true });

      /* ===========================================================
         CREATE ANCHORS
      ============================================================ */
      for (let i = 0; i < targets.length; i++) {
        const anchor = mindarThree.addAnchor(i);

        const gltf = await gltfLoader.loadAsync(targets[i].glb);
        gltf.scene.scale.setScalar(targets[i].scale);
        anchor.group.add(gltf.scene);
        targets[i].model = gltf.scene;

        const mixer = new THREE.AnimationMixer(gltf.scene);
        if (gltf.animations[0]) mixer.clipAction(gltf.animations[0]).play();
        mixers.push(mixer);

        const buffer = await loadAudio(targets[i].audio);
        const sound = new THREE.PositionalAudio(listener);
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setRefDistance(999999);
        anchor.group.add(sound);
        targets[i].audioObj = sound;

        anchor.onTargetFound = () => {
          targets[i].active = true;
          targets[i].audioReady = true;
          infoText.innerText = targets[i].info;
          targets.forEach((t, idx) => {
            if (idx !== i && t.audioObj) t.audioObj.pause();
          });
        };

        anchor.onTargetLost = () => {
          targets[i].active = false;
          if (targets[i].audioObj) targets[i].audioObj.pause();
        };
      }

      /* ===========================================================
         TAP → PLAY / PAUSE AUDIO
      ============================================================ */
      const detectTap = (x, y) => {
        const mouse = new THREE.Vector2(
          (x / window.innerWidth) * 2 - 1,
          -(y / window.innerHeight) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const idx = targets.findIndex(t => t.active);
        if (idx === -1) return;

        const hits = raycaster.intersectObjects(
          mindarThree.anchors[idx].group.children, true
        );

        if (hits.length && targets[idx].audioReady) {
          const a = targets[idx].audioObj;
          a.isPlaying ? a.pause() : a.play();
        }
      };

      document.addEventListener("click", e =>
        detectTap(e.clientX, e.clientY)
      );

      document.addEventListener("touchend", e => {
        if (isDragging) return;
        const t = e.changedTouches[0];
        detectTap(t.clientX, t.clientY);
      });

      /* ===========================================================
         ROTATE (MOUSE + TOUCH)
      ============================================================ */
      document.addEventListener("mousedown", e => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
      });

      document.addEventListener("mouseup", () => isDragging = false);

      document.addEventListener("mousemove", e => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        targets.forEach(t => {
          if (t.active && t.model) {
            t.model.rotation.y += dx * 0.01;
            t.model.rotation.x += dy * 0.01;
          }
        });
        prevX = e.clientX;
        prevY = e.clientY;
      });

      document.addEventListener("touchstart", e => {
        isDragging = true;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      });

      document.addEventListener("touchmove", e => {
        if (!isDragging) return;
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const dx = x - prevX;
        const dy = y - prevY;
        targets.forEach(t => {
          if (t.active && t.model) {
            t.model.rotation.y += dx * 0.01;
            t.model.rotation.x += dy * 0.01;
          }
        });
        prevX = x;
        prevY = y;
      });

      document.addEventListener("touchend", () => isDragging = false);

      /* ===========================================================
         START
      ============================================================ */
      await mindarThree.start();
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        mixers.forEach(m => m.update(clock.getDelta()));
        renderer.render(scene, camera);
      });

    } catch (err) {
      console.error("AR Error:", err);
    }
  };

  start();
});

import { loadAudio } from "/FYP/libs/loader.js";
import { DRACOLoader } from "/FYP/libs/three.js-r132/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "/FYP/libs/three.js-r132/examples/jsm/loaders/GLTFLoader.js";

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener('DOMContentLoaded', () => {
  const start = async () => {
    try {

      /* =====================
         BUTTON BACK + INFO
      ====================== */
      const backBtn = document.createElement("a");
      backBtn.innerHTML = `<img src="/FYP/image-menu/back.png" style="width:100%; height:auto; object-fit:contain;">`;
      backBtn.onclick = () => window.location.href = "/FYP/tongkitarsemula.html";
      Object.assign(backBtn.style, {
        position: "fixed",
        top: "clamp(10px, 3vw, 20px)",
        left: "clamp(10px, 3vw, 20px)",
        width: "clamp(70px, 12vw, 110px)",
        cursor: "pointer",
        zIndex: "9999",
        textDecoration: "none",
        display: "block"
      });
      document.body.appendChild(backBtn);

      const infoBtn = document.createElement("div");
      infoBtn.innerHTML = "💡";
      Object.assign(infoBtn.style, {
        position: "absolute",
        top: "10px",
        right: "20px",
        fontSize: "50px",
        cursor: "pointer",
        zIndex: "9999",
        userSelect: "none"
      });
      document.body.appendChild(infoBtn);

      const infoText = document.createElement("div");
      infoText.innerText = "INFO";
      Object.assign(infoText.style, {
        position: "fixed",
        bottom: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "14px 20px",
        maxWidth: "92%",
        background: "#8cd878",
        border: "3px solid #5faa48",
        color: "#1e4d14",
        fontSize: "clamp(16px, 4vw, 22px)",
        fontWeight: "bold",
        fontFamily: "'Comic Sans MS','Poppins'",
        borderRadius: "25px",
        boxShadow: "0px 8px 18px rgba(80,150,90,0.3)",
        display: "none",
        pointerEvents: "none",
        opacity: "0",
        transition: "all .25s ease",
        zIndex: "9999"
      });
      document.body.appendChild(infoText);

      let infoShown = false;
      infoBtn.onclick = () => {
        infoShown = !infoShown;
        if (infoShown) {
          infoText.style.display = "block";
          setTimeout(() => {
            infoText.style.opacity = "1";
            infoText.style.transform = "translateX(-50%) scale(1)";
          }, 10);
        } else {
          infoText.style.opacity = "0";
          infoText.style.transform = "translateX(-50%) scale(0.9)";
          setTimeout(() => (infoText.style.display = "none"), 200);
        }
      };

      /* =====================
         MINDAR INIT
      ====================== */
      const mindarThree = new window.MINDAR.IMAGE.MindARThree({
        container: document.body,
        imageTargetSrc: "/FYP/assets/targets/tongkitar/tongbiru3.mind",
      });

      const { renderer, scene, camera } = mindarThree;

      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      const dLoader = new DRACOLoader();
      dLoader.setDecoderPath("/FYP/libs/draco/");
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dLoader);

      /* =====================
         TARGETS
      ====================== */
      const targets = [
        { glb: "/FYP/assets/models/Mtongkitar/kertasmain.glb", audioMain: "/FYP/assets/suara/Stongkitar/tbiru1.mp3", scale: 0.2, info: "Tong biru sesuai untuk sampah jenis kertas" },
        { glb: "/FYP/assets/models/Mtongkitar/kertas1.glb", audioMain: "/FYP/assets/suara/Stongkitar/tbiru2.mp3", scale: 0.2, info: "Bahan kertas yang boleh dikitar semula adalah seperti surat khabar, kotak kertas dan sampul surat" },
        { glb: "/FYP/assets/models/Mtongkitar/kertas2.glb", audioMain: "/FYP/assets/suara/Stongkitar/tbiru3.mp3", scale: 0.18, info: "Bahan kertas yang tak boleh kitar semula adalah seperti cawan kertas, kotak berminyak dan nota lekat" }
      ];

      const mixers = [];
      const listener = new THREE.AudioListener();
      camera.add(listener);

      /* =====================
         AUDIO UNLOCK
      ====================== */
      let audioUnlocked = false;
      const unlockAudio = () => {
        if (audioUnlocked) return;
        const ctx = THREE.AudioContext.getContext();
        if (ctx.state === "suspended") ctx.resume();
        audioUnlocked = true;
      };
      document.addEventListener("touchstart", unlockAudio, { once: true });
      document.addEventListener("click", unlockAudio, { once: true });

      /* =====================
         LOAD TARGETS
      ====================== */
      for (let i = 0; i < targets.length; i++) {
        const anchor = mindarThree.addAnchor(i);

        const gltf = await new Promise((resolve, reject) => {
          gltfLoader.load(targets[i].glb, resolve, undefined, reject);
        });
        gltf.scene.scale.set(targets[i].scale, targets[i].scale, targets[i].scale);
        anchor.group.add(gltf.scene);
        targets[i].model = gltf.scene;

        const mixer = new THREE.AnimationMixer(gltf.scene);
        if (gltf.animations.length > 0) mixer.clipAction(gltf.animations[0]).play();
        mixers.push(mixer);

        const clip = await loadAudio(targets[i].audioMain);
        const audio = new THREE.PositionalAudio(listener);
        audio.setBuffer(clip);
        audio.setLoop(true);
        audio.setRefDistance(999999);
        anchor.group.add(audio);
        targets[i].mainAudio = audio;
        targets[i].audioReady = true;

        /* Target found / lost */
        anchor.onTargetFound = () => {
          targets[i].active = true;
          infoText.innerText = targets[i].info;
          targets.forEach((t, idx) => { if (idx !== i && t.mainAudio) t.mainAudio.pause(); });
        };
        anchor.onTargetLost = () => {
          targets[i].active = false;
          if (targets[i].mainAudio) {
            targets[i].mainAudio.pause();
            try { targets[i].mainAudio.currentTime = 0; } catch {}
          }
        };
      }

      /* =====================
         FAILSAFE AUDIO STOP
      ====================== */
      setInterval(() => {
        if (!targets.some(t => t.active)) {
          targets.forEach(t => { if (t.mainAudio && t.mainAudio.isPlaying) t.mainAudio.pause(); });
        }
      }, 500);

      /* =====================
         TAP AUDIO + ROTATE
      ====================== */
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      let lastTap = 0;
      let dragging = false, dragDist = 0, sx = 0, sy = 0, hasMoved = false;

      const tryTap = (x, y) => {
        const now = Date.now();
        const activeIndex = targets.findIndex(t => t.active);
        if (activeIndex === -1) return;
        const t = targets[activeIndex];
        const group = mindarThree.anchors[activeIndex].group;
        if (!t.mainAudio || !t.audioReady) return;

        const mouse = new THREE.Vector2();
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(group.children, true);
        if (intersects.length === 0) return;

        if (isMobile) {
          if (now - lastTap < 300) { // double tap
            t.mainAudio.isPlaying ? t.mainAudio.pause() : t.mainAudio.play();
          }
          lastTap = now;
        } else {
          t.mainAudio.isPlaying ? t.mainAudio.pause() : t.mainAudio.play();
        }
      };

      const TAP_THRESHOLD = isMobile ? 18 : 8;
      const MOVE_START_THRESHOLD = 5;

      /* MOBILE TOUCH */
      document.addEventListener("touchstart", (e) => {
        dragging = true; dragDist = 0; hasMoved = false;
        sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      });
      document.addEventListener("touchmove", (e) => {
        if (!dragging) return;
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const dx = x - sx; const dy = y - sy;
        if (Math.abs(dx) + Math.abs(dy) > MOVE_START_THRESHOLD) hasMoved = true;
        if (hasMoved) targets.forEach(t => { if (t.active && t.model) { t.model.rotation.y += dx * 0.008; t.model.rotation.x += dy * 0.008; } });
        dragDist += Math.abs(dx) + Math.abs(dy);
        sx = x; sy = y;
      });
      document.addEventListener("touchend", (e) => {
        if (!hasMoved || dragDist < TAP_THRESHOLD) tryTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        dragging = false;
      });

      /* LAPTOP CLICK */
      document.addEventListener("click", (e) => tryTap(e.clientX, e.clientY));

      /* DESKTOP ROTATE */
      let isDragging = false, prevX = 0, prevY = 0;
      document.addEventListener("mousedown", (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
      document.addEventListener("mouseup", () => isDragging = false);
      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX, dy = e.clientY - prevY;
        targets.forEach(t => { if (t.active && t.model) { t.model.rotation.y += dx * 0.01; t.model.rotation.x += dy * 0.01; } });
        prevX = e.clientX; prevY = e.clientY;
      });

      /* START MINDAR */
      await mindarThree.start();
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();
        mixers.forEach(m => m.update(delta));
        renderer.render(scene, camera);
      });

    } catch (e) {
      console.error("Error initializing AR:", e);
    }
  };

  start();
});

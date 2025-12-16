import { loadAudio } from "/FYP/libs/loader.js";
import { DRACOLoader } from "/FYP/libs/three.js-r132/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "/FYP/libs/three.js-r132/examples/jsm/loaders/GLTFLoader.js";

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener('DOMContentLoaded', () => {
  const start = async () => {
    try {

      /* ===========================================================
         BUTTON: BACK + AUDIO + INFO
      ============================================================ */
     const backBtn = document.createElement("a");
backBtn.innerHTML = `<img src="/FYP/image-menu/back.png" style="width:100%; height:auto; object-fit:contain;">`;

// redirect
backBtn.onclick = () => {
  window.location.href = "/FYP/proseskitar.html";
};

// style backBtn
Object.assign(backBtn.style, {
  position: "fixed",             // gunakan fixed supaya sentiasa atas screen
  top: "clamp(10px, 3vw, 20px)",
  left: "clamp(10px, 3vw, 20px)",
  width: "clamp(70px, 12vw, 110px)", // responsive width
  cursor: "pointer",
  zIndex: "9999",
  textDecoration: "none",
  display: "block",             // pastikan <a> ikut width gambar
});

// append
document.body.appendChild(backBtn);



      
      const infoBtn = document.createElement("div");
      infoBtn.innerHTML = "💡";
      infoBtn.style.position = "absolute";
      infoBtn.style.top = "10px";
      infoBtn.style.right = "20px";
      infoBtn.style.fontSize = "50px";
      infoBtn.style.cursor = "pointer";
      infoBtn.style.zIndex = "9999";
      document.body.appendChild(infoBtn);

      /* ===========================================================
         INFO TEXT (GLOBAL)
      ============================================================ */
      const infoText = document.createElement("div");
      infoText.innerText = "INFO";
      infoText.style.position = "absolute";
      infoText.style.bottom = "30px";
      infoText.style.left = "50%";
      infoText.style.transform = "translateX(-50%) scale(0.9)";
      infoText.style.padding = "18px 28px";
      infoText.style.maxWidth = "85%";
      infoText.style.background = "#8cd878";
      infoText.style.border = "3px solid #5faa48";
      infoText.style.color = "#1e4d14";
      infoText.style.fontSize = "24px";
      infoText.style.fontWeight = "bold";
      infoText.style.fontFamily = "'Comic Sans MS','Poppins'";
      infoText.style.borderRadius = "25px";
      infoText.style.boxShadow = "0px 8px 18px rgba(80,150,90,0.3)";
      infoText.style.display = "none";
      infoText.style.opacity = "0";
      infoText.style.transition = "all .25s ease";
      infoText.style.zIndex = "9999";
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

      /* ===========================================================
         MINDAR INIT
      ============================================================ */
      const mindarThree = new window.MINDAR.IMAGE.MindARThree({
        container: document.body,
        imageTargetSrc: "/FYP/assets/targets/proseskitar/Pkertas1.mind",
      });

      const { renderer, scene, camera } = mindarThree;

      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      const dLoader = new DRACOLoader();
      dLoader.setDecoderPath("/FYP/libs/draco/");
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dLoader);

      /* ===========================================================
         3 MODEL + 3 AUDIO + 3 TARGET
      ============================================================ */
      const targets = [
        {
          glb: "/FYP/assets/models/Mproseskitar/Pkertas1.glb",
          audioMain: "/FYP/assets/suara/Sproseskitar/Spkertas1.mp3",
                    scale: 0.2,
          info: "Semua kertas lama seperti surat khabar, buku dan kotak dikumpulkan. Kemudian, dipisahkan mengikut jenisnya.Kertas lama dihancurkan jadi cebisan kecil."
        },
        {
          glb: "/FYP/assets/models/Mproseskitar/Pkertas2.glb",
          audioMain: "/FYP/assets/suara/Sproseskitar/Spkertas2.mp3",
                   scale: 0.2,
          info: " Cebisan tadi dimasukkan dalam larutan air khas dan berubah menjadi pulpa iaitu bubur kertas lembut yang boleh dibentuk semula."
        },
        {
          glb: "/FYP/assets/models/Mproseskitar/Pkertas3.glb",
          audioMain: "/FYP/assets/suara/Sproseskitar/Spkertas3.mp3",
                   scale: 0.18,
          info: " Sebelum menjadi kertas baru, pulpa perlu dibersihkan dahulu. Ia ditapis untuk membuang plastik kecil, dakwat dan kotoran lain."
        },
{
          glb: "/FYP/assets/models/Mproseskitar/Pkertas4.glb",
          audioMain: "/FYP/assets/suara/Sproseskitar/Spkertas4.mp3",
                   scale: 0.18,
          info: "Pulpa diratakan,ditekan dan dikeringkan.Bubur kertas perlahan-lahan keras menjadi helaian."
        },
{
          glb: "/FYP/assets/models/Mproseskitar/Pkertas5.glb",
          audioMain: "/FYP/assets/suara/Sproseskitar/Spkertas5.mp3",
                   scale: 0.18,
          info: "Kertas lama kini menjadi barang baru seperti buku dan kotak tisu."
        }

      ];

      const mixers = [];
      const listener = new THREE.AudioListener();
      camera.add(listener);

      for (let i = 0; i < targets.length; i++) {
        const anchor = mindarThree.addAnchor(i);

        /* -------- LOAD GLB -------- */
        const gltf = await new Promise((resolve, reject) => {
          gltfLoader.load(targets[i].glb, resolve, undefined, reject);
        });

        gltf.scene.scale.set(targets[i].scale, targets[i].scale, targets[i].scale);
        anchor.group.add(gltf.scene);
	targets[i].modelScene = gltf.scene; 

        /* -------- Animation -------- */
        const mixer = new THREE.AnimationMixer(gltf.scene);
        if (gltf.animations.length > 0) {
          mixer.clipAction(gltf.animations[0]).play();
        }
        mixers.push(mixer);

        /* -------- AUDIO MAIN -------- */
        const clip1 = await loadAudio(targets[i].audioMain);
        const mainAudio = new THREE.PositionalAudio(listener);
        mainAudio.setBuffer(clip1);
        mainAudio.setLoop(true);
        mainAudio.setRefDistance(999999);
        anchor.group.add(mainAudio);
        targets[i].mainAudio = mainAudio;


               /* -------- TARGET FOUND -------- */
       anchor.onTargetFound = () => {
 	 targets[i].active = true;


          infoText.innerText = targets[i].info;

	// stop all other audio
          targets.forEach((t, idx) => {
            if (idx !== i && t.mainAudio) t.mainAudio.pause();
          });

        // 🔥 AUTO PLAY BILA DETECT
  if (targets[i].mainAudio && !targets[i].mainAudio.isPlaying) {
    try {
          targets[i].mainAudio.currentTime = 0;
            } catch (err) {
              // beberapa implementasi PositionalAudio mungkin tidak beri currentTime setter — safe guard
            }
            targets[i].mainAudio.play();
          }
        };

        /* -------- TARGET LOST -------- */
        anchor.onTargetLost = () => {
 	 targets[i].active = false;
 // STOP AUDIO SERTA-MERTA
          if (targets[i].mainAudio) {
            targets[i].mainAudio.pause();
            try {
              targets[i].mainAudio.currentTime = 0; // reset supaya bila detect lagi, sync mula dari awal
            } catch (err) {
              // ignore jika tidak supported
            }
          }

 	};

      }

/* ===========================================================
         FAILSAFE AUDIO STOP (if no target active)
      ============================================================ */
      setInterval(() => {
        const anyActive = targets.some(t => t.active);
        if (!anyActive) {
          targets.forEach(t => {
            if (t.mainAudio && t.mainAudio.isPlaying) {
              t.mainAudio.pause();
              try {
                t.mainAudio.currentTime = 0;
              } catch (err) { }
            }
          });
        }
      }, 500);


/* ===========================================================
   TAP / CLICK MODEL UNTUK PAUSE / PLAY
=========================================================== */

const detectTap = (x, y) => {
  const mouse = new THREE.Vector2();
  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = -(y / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // cari target active sahaja
  const activeIndex = targets.findIndex(t => t.active);
  if (activeIndex === -1) return;

  const t = targets[activeIndex];
  const sceneObj = mindarThree.anchors[activeIndex].group;

  const intersects = raycaster.intersectObjects(sceneObj.children, true);

  if (intersects.length > 0) {
    const audio = t.mainAudio;

    if (audio.isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }
};

/* Mobile tap */
document.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  detectTap(touch.clientX, touch.clientY);
});

/* Laptop click */
document.addEventListener("click", (e) => {
  detectTap(e.clientX, e.clientY);
});

      
      /* ===========================================================
         ROTATE + ZOOM (GLOBAL)
      ============================================================ */
      let isDragging = false, prevX = 0, prevY = 0;

      document.addEventListener("mousedown", (e) => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
      });

      document.addEventListener("mouseup", () => (isDragging = false));

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;

        // rotate active model
        targets.forEach(t => {
          if (t.active && t.modelScene) {
            t.modelScene.rotation.y += dx * 0.01;
            t.modelScene.rotation.x += dy * 0.01;
          }
        });

        prevX = e.clientX;
        prevY = e.clientY;
      });

      /* ===========================================================
         START MINDAR
      ============================================================ */
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


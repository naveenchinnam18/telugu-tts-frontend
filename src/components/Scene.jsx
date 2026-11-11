import { useEffect, useRef } from "react";
import * as THREE from "three";

// Animated 3D background: wireframe shapes + particles, reacts to mouse and to "active" (generating).
export default function Scene({ active }) {
  const mount = useRef(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const el = mount.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return; // no WebGL: page still works with CSS background
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    el.appendChild(renderer.domElement);

    const mat = (color, opacity) =>
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });

    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.7, 0.5, 180, 26), mat(0x8b5cf6, 0.35));
    const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), mat(0x22d3ee, 0.4));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.02, 12, 120), mat(0xf472b6, 0.6));
    scene.add(knot, ico, ring);

    const N = 900;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 40;
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(
      pg,
      new THREE.PointsMaterial({ color: 0xbfb5ff, size: 0.05, transparent: true, opacity: 0.8 })
    );
    scene.add(stars);

    const layout = () => {
      const mobile = window.innerWidth < 800;
      knot.position.set(mobile ? 0 : 5, mobile ? 3.2 : 0.5, -2);
      ico.position.set(mobile ? 0 : -5.2, mobile ? -3.5 : -1.2, -2);
      ring.position.copy(knot.position);
      const s = mobile ? 0.6 : 1;
      knot.scale.setScalar(s);
      ico.scale.setScalar(s);
      ring.scale.setScalar(s);
    };
    layout();

    const mouse = { x: 0, y: 0 };
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      layout();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);

    let raf;
    let speed = 1;
    const clock = new THREE.Clock();
    const tick = () => {
      const t = clock.getElapsedTime();
      const target = activeRef.current ? 5 : 1;
      speed += (target - speed) * 0.05;

      knot.rotation.x = t * 0.15 * speed;
      knot.rotation.y = t * 0.22 * speed;
      ico.rotation.x = -t * 0.2 * speed;
      ico.rotation.y = t * 0.25 * speed;
      ring.rotation.x = t * 0.3 * speed;
      ring.rotation.y = t * 0.1 * speed;
      const pulse = 1 + (activeRef.current ? Math.sin(t * 6) * 0.06 : 0);
      knot.scale.setScalar((window.innerWidth < 800 ? 0.6 : 1) * pulse);

      stars.rotation.y = t * 0.01 * speed;
      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 0.6 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      [knot, ico, ring].forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      pg.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="scene" ref={mount} aria-hidden="true" />;
}

import { useRef } from "react";

// Wrapper that tilts in 3D following the mouse and adds a light glare.
export default function TiltCard({ as: Tag = "div", max = 10, className = "", children, ...rest }) {
  const ref = useRef(null);

  const move = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <Tag ref={ref} className={`tilt ${className}`} onMouseMove={move} onMouseLeave={leave} {...rest}>
      {children}
    </Tag>
  );
}

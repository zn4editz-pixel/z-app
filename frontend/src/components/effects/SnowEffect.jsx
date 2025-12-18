import { useEffect, useRef } from "react";
const SnowEffect = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    const snowflakes = [];
    const count = 100;
    class Snowflake {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * -1; // Start above screen
        this.size = Math.random() * 3 + 1;
        this.speedConfig = Math.random() * 1 + 0.5;
        this.speed = this.speedConfig;
        this.swing = Math.random() * 3;
        this.swingCount = Math.random() * 3;
      }
      update() {
        this.y += this.speed;
        this.swingCount += 0.02;
        this.x += Math.sin(this.swingCount) * 0.5;
        // Reset if off bottom
        if (this.y > canvas.height) {
          this.reset();
        }
      }
      draw() {
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let i = 0; i < count; i++) {
      snowflakes.push(new Snowflake());
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      snowflakes.forEach((flake) => {
        flake.update();
        flake.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 50, // Above most things, but below modals if needed
      }}
    />
  );
};
export default SnowEffect;

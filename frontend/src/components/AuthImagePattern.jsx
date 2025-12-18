import OrbitAnimation from "./animations/OrbitAnimation";
import StrangerAnimation from "./animations/StrangerAnimation";
import LiveMatchAnimation from "./animations/LiveMatchAnimation";
import ConnectAnimation from "./animations/ConnectAnimation";
import { useImagePreloader } from "../hooks/useImagePreloader";
const AuthImagePattern = ({
  title,
  subtitle,
  variant = "signup",
  animationType,
}) => {
  // Preload heavy assets
  useImagePreloader();
  // If specific animation type is passed, prioritize it.
  // Otherwise, fallback to defaults: 'orbit' for login, 'stranger' for signup.
  const currentAnimation =
    animationType || (variant === "login" ? "orbit" : "stranger");
  switch (currentAnimation) {
    case "orbit":
      return <OrbitAnimation title={title} subtitle={subtitle} />;
    case "stranger":
      return <StrangerAnimation />;
    case "live-match":
      return <LiveMatchAnimation />;
    case "connect":
      return <ConnectAnimation />;
    default:
      return <OrbitAnimation title={title} subtitle={subtitle} />;
  }
};
export default AuthImagePattern;

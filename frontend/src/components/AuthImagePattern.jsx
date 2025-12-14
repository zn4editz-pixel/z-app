import OrbitAnimation from "./animations/OrbitAnimation";
import StrangerAnimation from "./animations/StrangerAnimation";
import LiveMatchAnimation from "./animations/LiveMatchAnimation";

const AuthImagePattern = ({ title, subtitle, variant = "signup", animationType }) => {
  // If specific animation type is passed, prioritize it.
  // Otherwise, fallback to defaults: 'orbit' for login, 'stranger' for signup.

  const currentAnimation = animationType || (variant === "login" ? "orbit" : "stranger");

  // Render the selected animation
  switch (currentAnimation) {
    case "orbit":
      return <OrbitAnimation title={title} subtitle={subtitle} />;
    case "stranger":
      return <StrangerAnimation />;
    case "live-match":
      return <LiveMatchAnimation />;
    default:
      return <OrbitAnimation title={title} subtitle={subtitle} />;
  }
};

export default AuthImagePattern;

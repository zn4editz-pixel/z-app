import { BadgeCheck } from "lucide-react";

const VerifiedBadge = ({ size = "sm", className = "" }) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  return (
    <BadgeCheck
      className={`${sizeClasses[size]} text-warning fill-warning/20 flex-shrink-0 ${className}`}
      title="Verified"
    />
  );
};

export default VerifiedBadge;

import { X } from "lucide-react";
import { UserAvatar } from "@/components/auth/UserAvatar";

interface UserChipProps {
  email: string;
  name: string;
  imageUrl?: string;
  onRemove?: () => void;
  size?: "sm" | "md";
}

/**
 * UserChip
 *
 * A compact chip component displaying a user with avatar and remove button.
 * Used for showing selected users in multi-select contexts.
 */
export function UserChip({
  email,
  name,
  imageUrl,
  onRemove,
  size = "md",
}: UserChipProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-small gap-1.5",
    md: "px-3 py-1.5 text-small gap-2",
  };

  const avatarSize = size === "sm" ? "xs" : "xs";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <div
      className={`
        flex items-center bg-secondary rounded-full text-medium
        ${sizeClasses[size]}
      `}
    >
      <UserAvatar
        email={email}
        name={name}
        imageUrl={imageUrl}
        size={avatarSize}
      />
      <span>{name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:text-destructive transition-colors"
          aria-label={`Remove ${name}`}
        >
          <X className={iconSize} />
        </button>
      )}
    </div>
  );
}

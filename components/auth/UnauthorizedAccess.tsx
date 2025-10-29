interface UnauthorizedAccessProps {
  userEmail?: string;
}

export function UnauthorizedAccess({ userEmail }: UnauthorizedAccessProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Unauthorized Access
            </h1>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <p className="text-muted-foreground">
              You don't have permission to access Artifact.
            </p>
            {userEmail && (
              <p className="text-sm text-muted-foreground">
                Your account: <span className="font-mono">{userEmail}</span>
              </p>
            )}
          </div>

          {/* Additional info */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact the administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


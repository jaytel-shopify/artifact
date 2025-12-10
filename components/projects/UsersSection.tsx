"use client";

import Link from "@/components/ui/TransitionLink";
import { Card } from "@/components/ui/card";
import type { User } from "@/types";

interface UsersSectionProps {
  users: User[];
  title?: string;
}

/**
 * Section component for displaying a grid of users
 * Used in search results to show matching people
 */
export function UsersSection({ users, title = "People" }: UsersSectionProps) {
  if (users.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-large">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Link key={user.id} href={`/user/?id=${user.id}`}>
            <Card className="p-4 flex items-center gap-3 hover:bg-background-secondary transition-colors cursor-pointer">
              <div className="flex align-center items-center gap-4 w-full justify-between">
                <div className="min-w-0 space-y-1">
                  <h3 className="text-medium text-text-primary truncate">
                    {user.name}
                  </h3>
                  <p className="text-small text-text-secondary truncate">
                    {user.title}
                  </p>
                </div>
                {user.slack_image_url ? (
                  <img
                    src={user.slack_image_url}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-text-secondary flex-shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

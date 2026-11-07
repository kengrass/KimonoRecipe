import Image from "next/image";
import Link from "next/link";
import { UserAvatar } from "@/base/ui/UserAvatar";
import type { PopularUser } from "@/lib/discovery-data";

type Props = {
  users: PopularUser[];
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

/** 人気ユーザー（アバター＋名前） */
export function PopularUsersRow({ users }: Props) {
  if (!users.length) return null;

  return (
    <ul className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-6">
      {users.map((user) => {
        const external = isExternalHref(user.profile_url);
        const body = (
          <>
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-neutral-200">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <UserAvatar
                  name={user.name}
                  seed={user.id}
                  className="h-full w-full text-xl"
                />
              )}
            </div>
            <span className="line-clamp-2 text-xs leading-snug text-kr-text group-hover:text-kr-link">
              {user.name}
            </span>
          </>
        );

        return (
          <li key={user.id}>
            {external ? (
              <a
                href={user.profile_url}
                className="group flex flex-col items-center gap-2 text-center"
                target="_blank"
                rel="noreferrer"
              >
                {body}
              </a>
            ) : (
              <Link
                href={user.profile_url}
                className="group flex flex-col items-center gap-2 text-center"
              >
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import Image from "next/image";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row justify-between px-2 py-1">
        <nav className="flex text-lg items-center justify-center">
          <Link href="/" className="flex items-center justify-center">
            <Image src="/logo.png" alt="Logo" width={60} height={60} />
            <div className="font-mono">SCOUT</div>
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}

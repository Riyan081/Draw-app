
import Link from "next/link";
import { forwardRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, ReactNode } from "react";

interface NavLinkCompatProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  children?: ReactNode;
  exact?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, href, children, exact = false, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = href
      ? exact
        ? pathname === href
        : pathname?.startsWith(href)
      : false;

    return (
      <Link href={href} legacyBehavior>
        <a ref={ref} className={cn(className, isActive && activeClassName)} {...props}>
          {children}
        </a>
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };

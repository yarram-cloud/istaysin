import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  href?: string;
  showText?: boolean;
}

export function Logo({ 
  className, 
  imageClassName, 
  textClassName, 
  href = "/dashboard", 
  showText = true 
}: LogoProps) {
  return (
    <Link 
      href={href} 
      className={cn("flex items-center gap-2 transition-transform hover:scale-105", className)}
    >
      <div className={cn("relative w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm", imageClassName)}>
        <Image 
          src="/images/logo.png" 
          alt="iStays Logo" 
          fill
          className="object-cover"
          sizes="32px"
          priority
        />
      </div>
      {showText && (
        <span className={cn("font-display font-bold text-lg tracking-tight", textClassName)}>
          istaysin
        </span>
      )}
    </Link>
  );
}

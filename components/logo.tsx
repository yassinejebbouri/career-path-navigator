import type { HTMLAttributes } from "react"
import Image from "next/image"

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
  showImage?: boolean
}

export default function Logo({ className, showImage = false, ...props }: LogoProps) {
  return (
    <div className={`font-bold flex items-center ${className}`} {...props}>
      {showImage && <Image src="/images/logo-app.png" alt="SkillPath Logo" width={200} height={200} className="mr-2" />}
    </div>
  )
}

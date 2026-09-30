import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const variants = {
  footer: {
    duration: "35s",
    item: "px-3 md:px-4",
    logo: "h-20 w-[200px] opacity-85 group-hover:opacity-100 sm:h-24 sm:w-[240px]",
  },
  header: {
    duration: "45s",
    item: "px-2",
    logo: "h-10 w-[100px] opacity-55 group-hover:opacity-100",
  },
} as const;

export function SponsorsMarquee({
  variant,
  className,
}: {
  variant: keyof typeof variants;
  className?: string;
}) {
  const styles = variants[variant];

  return (
    <div
      className={cn("sponsors-marquee overflow-hidden", className)}
      style={{ "--marquee-duration": styles.duration } as React.CSSProperties}
    >
      <div className="sponsors-marquee-track flex w-max items-center">
        {[0, 1].flatMap((copy) =>
          siteConfig.sponsors.map((sponsor) => {
            const href = "href" in sponsor ? sponsor.href : undefined;
            const key = `${copy}-${sponsor.name}`;
            const duplicate = copy === 1;
            const itemClass = cn("group shrink-0", styles.item);
            const logo = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className={cn(
                  "object-contain transition duration-200",
                  styles.logo,
                  !sponsor.monochrome && "brightness-0 invert",
                )}
              />
            );

            if (href) {
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={itemClass}
                  title={sponsor.name}
                  aria-hidden={duplicate || undefined}
                  tabIndex={duplicate ? -1 : undefined}
                >
                  {logo}
                </a>
              );
            }

            return (
              <span
                key={key}
                className={itemClass}
                title={sponsor.name}
                aria-hidden={duplicate || undefined}
              >
                {logo}
              </span>
            );
          }),
        )}
      </div>
    </div>
  );
}

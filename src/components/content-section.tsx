import { cn } from "@/lib/utils";

export function ContentSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto max-w-6xl px-4 py-10", className)}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white md:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-base text-white/75">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

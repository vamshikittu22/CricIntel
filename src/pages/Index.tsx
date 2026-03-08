import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { PlayerCard } from "@/components/PlayerCard";
import { useFeaturedPlayers } from "@/lib/hooks/usePlayers";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const Index = () => {
  const { data: players, isLoading } = useFeaturedPlayers();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="font-heading text-4xl font-bold tracking-tight md:text-6xl">
              Cricket Player{" "}
              <span className="text-primary">Analytics</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Ball-by-ball performance insights, tactical intelligence, and
              data-driven decisions for cricket.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10"
          >
            <SearchBar />
          </motion.div>
        </div>
      </section>

      {/* Featured Players */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="font-heading text-2xl font-semibold mb-6">
          Featured Players
        </h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players?.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <PlayerCard player={p} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;

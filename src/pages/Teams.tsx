import { AppHeader } from "@/components/AppHeader";
import { useCountries } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Teams = () => {
  const { data: countries } = useCountries();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Teams</h1>
        <p className="text-muted-foreground mb-8">Browse cricket teams and view their players</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {countries?.filter(c => c !== "All Countries").map((country, index) => (
            <motion.button
              key={country}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              onClick={() => navigate(`/players?country=${encodeURIComponent(country)}`)}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <span className="text-5xl">{getFlag(country)}</span>
              <span className="text-sm font-bold text-center">{country}</span>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Teams;

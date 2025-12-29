import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b-gray-800 border-border bg-[#161B21]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center wiggle">
            <Pencil className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">Sketchy</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-body">
            Features
          </a>
          <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors font-body">
            Demo
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-body">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign In
          </Button>
          <Button variant="sketch" size="sm">
            Start Drawing
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

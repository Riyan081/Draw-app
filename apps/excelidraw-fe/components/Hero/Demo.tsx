import { Button } from "@/components/ui/button";
import { Play, Square, Circle, ArrowRight, Type, Minus } from "lucide-react";

const tools = [
  { icon: Square, label: "Rectangle" },
  { icon: Circle, label: "Ellipse" },
  { icon: Minus, label: "Line" },
  { icon: ArrowRight, label: "Arrow" },
  { icon: Type, label: "Text" },
];

const Demo = () => {
  return (
    <section id="demo" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-5xl sm:text-6xl font-bold text-foreground mb-4">
            See it in action
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Simple tools, infinite possibilities. Start creating in seconds.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="sketch-card overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
              {tools.map((tool) => (
                <button
                  key={tool.label}
                  className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={tool.label}
                >
                  <tool.icon className="w-5 h-5" />
                </button>
              ))}
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary" />
                <div className="w-6 h-6 rounded-full bg-secondary" />
                <div className="w-6 h-6 rounded-full bg-accent" />
                <div className="w-6 h-6 rounded-full bg-foreground" />
              </div>
            </div>

            {/* Canvas area */}
            <div className="aspect-video bg-background relative">
              <CanvasDemo />
              
              {/* Floating action */}
              <div className="absolute bottom-6 right-6">
                <Button variant="sketch" size="lg" className="group">
                  <Play className="w-5 h-5" />
                  Try it yourself
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="font-display text-5xl font-bold text-primary mb-2">10M+</div>
              <div className="font-body text-muted-foreground">Sketches created</div>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl font-bold text-secondary mb-2">500K+</div>
              <div className="font-body text-muted-foreground">Happy users</div>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl font-bold text-accent mb-2">99.9%</div>
              <div className="font-body text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CanvasDemo = () => {
  return (
    <svg viewBox="0 0 800 450" className="w-full h-full">
      {/* Grid */}
      <defs>
        <pattern id="demo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#demo-grid)" />

      {/* Mind map style diagram */}
      <g>
        {/* Central node */}
        <ellipse cx="400" cy="225" rx="80" ry="45" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
        <text x="400" y="230" textAnchor="middle" className="font-display text-xl font-bold" fill="hsl(var(--foreground))">Big Idea</text>

        {/* Branch 1 - Top Left */}
        <path d="M 340 190 Q 280 140 220 120" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
        <rect x="120" y="80" width="120" height="60" rx="8" fill="hsl(var(--secondary) / 0.15)" stroke="hsl(var(--secondary))" strokeWidth="2" />
        <text x="180" y="115" textAnchor="middle" className="font-display text-lg" fill="hsl(var(--foreground))">Research</text>

        {/* Branch 2 - Top Right */}
        <path d="M 460 190 Q 520 140 580 120" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
        <rect x="560" y="80" width="120" height="60" rx="8" fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent))" strokeWidth="2" />
        <text x="620" y="115" textAnchor="middle" className="font-display text-lg" fill="hsl(var(--foreground))">Design</text>

        {/* Branch 3 - Bottom Left */}
        <path d="M 340 260 Q 280 310 220 330" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
        <rect x="120" y="310" width="120" height="60" rx="8" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
        <text x="180" y="345" textAnchor="middle" className="font-display text-lg" fill="hsl(var(--foreground))">Build</text>

        {/* Branch 4 - Bottom Right */}
        <path d="M 460 260 Q 520 310 580 330" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
        <rect x="560" y="310" width="120" height="60" rx="8" fill="hsl(var(--secondary) / 0.15)" stroke="hsl(var(--secondary))" strokeWidth="2" />
        <text x="620" y="345" textAnchor="middle" className="font-display text-lg" fill="hsl(var(--foreground))">Launch</text>

        {/* Cursor */}
        <g className="float" style={{ animationDelay: '0.5s' }}>
          <path d="M 500 280 L 500 305 L 510 295 L 520 305 L 500 280" fill="hsl(var(--secondary))" stroke="hsl(var(--foreground))" strokeWidth="1" />
          <rect x="510" y="290" width="60" height="20" rx="4" fill="hsl(var(--secondary))" />
          <text x="540" y="304" textAnchor="middle" className="text-xs font-body" fill="hsl(var(--secondary-foreground))">Sarah</text>
        </g>
      </g>
    </svg>
  );
};

export default Demo;

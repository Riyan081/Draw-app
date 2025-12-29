import { Users, Download, Zap, Palette, Globe, Lock } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Work together with your team in real-time. See cursors, edits, and comments instantly.",
    color: "primary",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description: "Export your sketches as PNG, SVG, or copy to clipboard. Perfect for presentations.",
    color: "secondary",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description: "Built with performance in mind. Handles thousands of elements without breaking a sweat.",
    color: "accent",
  },
  {
    icon: Palette,
    title: "Hand-drawn Style",
    description: "Beautiful, organic-looking diagrams that feel personal and approachable.",
    color: "primary",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description: "No installation needed. Works in any modern browser on any device.",
    color: "secondary",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Your data stays in your browser. We don't store your sketches on our servers.",
    color: "accent",
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
};

const Features = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-5xl sm:text-6xl font-bold text-foreground mb-4">
            Everything you need
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Powerful features wrapped in a simple, intuitive interface that gets out of your way.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="sketch-card p-6 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              <div className={`w-12 h-12 rounded-lg ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="font-body text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

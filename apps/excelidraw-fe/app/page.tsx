import Image from "next/image";
import Header from "@/components/Hero/Header";
import Hero from "@/components/Hero/Hero";
import Features from "@/components/Hero/Features";
import Demo from "@/components/Hero/Demo";
import CTA from "@/components/Hero/CTA";
import Footer from "@/components/Hero/Footer";
export default function Home() {
  return (
     <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Demo />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}




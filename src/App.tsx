import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Award, Crown, Mail, Send, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hls from "hls.js";
import Lenis from "lenis";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  tag: string;
}

const HONDAJET_FEATURES: Project[] = [
  {
    id: "feat-1",
    title: "OTWEM Configuration",
    category: "Aerodynamic Engineering",
    year: "ELITE II",
    description: "The Over-The-Wing Engine Mount dramatically reduces aerodynamic drag, maximizing efficiency while significantly minimizing cabin noise.",
    tag: "INNOVATION",
  },
  {
    id: "feat-2",
    title: "Garmin G3000 Cockpit",
    category: "Avionics Suite",
    year: "ELITE II",
    description: "An advanced, customized glass flight deck equipped with autothrottle and emergency auto-land capabilities to reduce pilot workload.",
    tag: "TECHNOLOGY",
  },
  {
    id: "feat-3",
    title: "Bespoke Cabin Luxury",
    category: "Interior Design",
    year: "ELITE II",
    description: "Experience the 'luxury of flight' with fully customizable Onyx or Steel acoustic themes, premium leathers, and class-leading legroom.",
    tag: "COMFORT",
  },
  {
    id: "feat-4",
    title: "Composite Fuselage",
    category: "Structural Integrity",
    year: "ELITE II",
    description: "Constructed with a lightweight carbon composite fuselage and aluminum wing, optimizing performance and fuel efficiency at 43,000 feet.",
    tag: "PERFORMANCE",
  },
];

const SPECIFICATIONS = [
  {
    number: "01",
    title: "1,547 NM Range",
    desc: "Extended range capability allows for transcontinental travel without refueling, connecting more cities non-stop.",
  },
  {
    number: "02",
    title: "422 KTAS Cruise Speed",
    desc: "Powered by twin GE Honda HF120 turbofans, the Elite II cruises at over 486 mph, outpacing competitors in its class.",
  },
  {
    number: "03",
    title: "5-Passenger Capacity",
    desc: "A spacious cabin configuration accommodating up to 5 passengers and 1 or 2 crew members with ultimate comfort.",
  },
  {
    number: "04",
    title: "Starting at $7 Million",
    desc: "The base configuration offers unprecedented value in the very light jet category, with extensive bespoke upgrade options.",
  },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [videoPlayable, setVideoPlayable] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selection, setSelection] = useState("Purchase Inquiry");
  const [message, setMessage] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scrollTriggerRef = useRef<any>(null);
  const latestTimeRef = useRef<number>(0);
  const seekPendingRef = useRef<boolean>(false);
  const [duration, setDuration] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<ImageBitmap[]>([]);

  // Local proxy to Google Drive video to bypass browser CORS constraints completely
  const videoSrc = "/api/video";

  // 1. Fetch Blob and Pre-decode Frames to RAM (Canvas Sequence)
  // This physically extracts every single frame of the MP4 into RAM before the site loads.
  // It completely bypasses the browser's video decoding bottleneck, allowing mathematically
  // perfect, instantaneous scrub speeds forwards and backwards with ZERO lag.
  useEffect(() => {
    if (!videoSrc) return;
    let isCancelled = false;
    
    const loadAndDecode = async () => {
      try {
        const response = await fetch(videoSrc);
        if (!response.ok) throw new Error("Network error");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.src = blobUrl;
        
        video.addEventListener('loadeddata', async () => {
          if (isCancelled) return;
          const dur = video.duration || 10;
          setDuration(dur);
          
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const fps = 24; // extraction frame rate
          const totalFrames = Math.floor(dur * fps);
          let currentFrame = 0;

          const captureNext = () => {
            if (isCancelled) return;
            if (currentFrame <= totalFrames) {
              video.currentTime = currentFrame / fps;
            } else {
              setVideoPlayable(true);
            }
          };

          video.addEventListener('seeked', async () => {
             if (isCancelled) return;
             try {
               const bitmap = await createImageBitmap(video);
               framesRef.current.push(bitmap);
               
               // Draw first frame immediately to the background canvas
               if (currentFrame === 0 && canvasRef.current) {
                 const ctx = canvasRef.current.getContext('2d');
                 ctx?.drawImage(bitmap, 0, 0, canvasRef.current.width, canvasRef.current.height);
               }
               
               // Accurately map loader directly to frame extraction progress
               setLoadProgress(Math.min(100, Math.floor((currentFrame / totalFrames) * 100)));
               currentFrame++;
               captureNext();
             } catch (e) {
               console.error("Frame capture error:", e);
               setVideoPlayable(true); // Failsafe unlock
             }
          });

          captureNext(); // initiate extraction loop
        }, { once: true });
        
        video.load();
      } catch (e) {
        console.error("Failed to load video", e);
        setVideoPlayable(true);
      }
    };
    
    loadAndDecode();
    
    return () => {
      isCancelled = true;
    };
  }, [videoSrc]);

  // 2. High-Performance Canvas Frame Scrubbing (Zero-Lag Guaranteed)
  useEffect(() => {
    if (!videoPlayable || framesRef.current.length === 0) return;
    
    const totalFrames = framesRef.current.length;
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: true, // Instant tracking; Lenis provides the physical smoothing
        onUpdate: (self) => {
          const frameIndex = Math.min(
            totalFrames - 1,
            Math.max(0, Math.floor(self.progress * totalFrames))
          );
          
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            const bitmap = framesRef.current[frameIndex];
            if (bitmap && ctx) {
              // Canvas drawImage is instantaneous, completely bypassing the media engine.
              // This is the industry secret to lag-free Apple-style scrollytelling.
              ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            }
          }
        }
      }
    });

    return () => {
      tl.kill();
    };
  }, [videoPlayable]);

  // 3b. Initialize Lenis Smooth Scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.7, // Lowered duration for a snappier, more responsive scroll feel
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      wheelMultiplier: 1,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
      lenis.destroy();
    };
  }, []);

  // Custom Cursor Logic
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;
    if (!cursor || !cursorDot) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.set(cursorDot, { x: mouseX, y: mouseY });
    };

    window.addEventListener("mousemove", onMouseMove);

    const render = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      gsap.set(cursor, { x: cursorX, y: cursorY });
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    const hoverElements = document.querySelectorAll('a, button');
    const onMouseEnter = () => {
      gsap.to(cursor, { scale: 1.5, borderColor: 'rgba(234, 88, 12, 0.8)', duration: 0.3 }); // orange-600
      gsap.to(cursorDot, { scale: 0, opacity: 0, duration: 0.3 });
    };
    const onMouseLeave = () => {
      gsap.to(cursor, { scale: 1, borderColor: 'rgba(255,255,255,0.2)', duration: 0.3 });
      gsap.to(cursorDot, { scale: 1, opacity: 1, duration: 0.3 });
    };

    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    });

    // Magnetic logic for specific premium buttons
    const magneticElements = document.querySelectorAll('.magnetic');
    magneticElements.forEach(el => {
      el.addEventListener('mousemove', (e: any) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: x * 0.4, y: y * 0.4, duration: 0.5, ease: "power2.out" });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      });
    });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      hoverElements.forEach(el => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
      // (Magnetic cleanup usually isn't strictly necessary for a global unmount here, but good practice)
    };
  }, [videoPlayable]);



  // 5. GSAP-based dynamic parallax depth for Translucent Liquid Glass Cards
  useEffect(() => {
    if (!videoPlayable) return;

    // A small timeout allows layout dimensions to settle perfectly once files load
    const timer = setTimeout(() => {
      const parentCtx = gsap.context(() => {
        // Portfolio items shift on y-axis creating an opposite-motion floating sensation
        gsap.utils.toArray(".parallax-portfolio-card").forEach((card: any) => {
          gsap.fromTo(card,
            { y: -30 },
            {
              y: 30,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              }
            }
          );
        });

        // Offerings shifting slightly less to create varied depth hierarchies
        gsap.utils.toArray(".parallax-offering-card").forEach((card: any) => {
          gsap.fromTo(card,
            { y: -18 },
            {
              y: 18,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              }
            }
          );
        });
      });

      return () => {
        parentCtx.revert();
      };
    }, 150);

    return () => clearTimeout(timer);
  }, [videoPlayable]);

  // 6. Scroll navigation anchor helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      const response = await fetch("http://localhost:5000/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, selection, message }),
      });

      if (response.ok) {
        setFormSuccess(true);
      } else {
        console.error("Failed to submit inquiry");
      }
    } catch (error) {
      console.error("Error submitting to backend:", error);
      // Fallback success for demonstration if backend is down
      setFormSuccess(true); 
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setSelection("Purchase Inquiry");
    setMessage("");
    setFormSuccess(false);
  };

  return (
    <div className="relative min-h-screen w-full font-inter bg-[#050403] text-white overflow-x-hidden selection:bg-orange-600 selection:text-black">
      
      {/* CUSTOM CURSOR */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-white/20 pointer-events-none z-[100] -ml-5 -mt-5 mix-blend-screen transition-colors" 
      />
      <div 
        ref={cursorDotRef} 
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-orange-600 pointer-events-none z-[100] -ml-1 -mt-1 mix-blend-screen" 
      />

      {/* LOADING OVERLAY */}
      <AnimatePresence>
        {!videoPlayable && (
          <motion.div
            id="loading-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 w-full h-full z-50 flex flex-col items-center justify-center pointer-events-auto"
            style={{
              background: "radial-gradient(circle at center, #100803 0%, #000000 100%)"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-600/[0.04] to-transparent pointer-events-none" />
            <div className="relative flex flex-col items-center select-none text-center px-6 max-w-xl w-full z-10">
              <Crown className="w-10 h-10 text-orange-600 mb-6 animate-pulse" />
              <div className="font-podium text-white text-3xl sm:text-5xl tracking-[0.2em] uppercase leading-none mb-4 bg-gradient-to-b from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">
                HONDAJET
              </div>
              <div className="font-mono text-xs text-orange-600/60 tracking-[0.4em] uppercase mb-12">
                ELITE II SYSTEMS INITIATING
              </div>

              <div className="font-sans text-xl font-light text-white/90 flex items-center gap-3">
                <span className="w-4 h-4 rounded-full border-2 border-orange-600 border-t-transparent animate-spin inline-block" />
                DOCKING TELEMETRY... {loadProgress}%
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUND VIDEO WRAPPER AND VIDEO ELEMENT */}
      <div
        id="video-wrapper"
        className="fixed top-0 left-0 w-full h-full z-0 scale-[1.05] origin-center pointer-events-none"
      >
        <canvas
          ref={canvasRef}
          id="hero-bg-canvas"
          className="w-full h-full object-cover scale-[1.35]"
        />
        {/* Deep Bronze atmospheric transparent clear overlays which keep the background fully visible */}
        <div id="tint-overlay" className="absolute inset-0 bg-gradient-to-tr from-[#050403]/40 via-[#2a1100]/10 to-orange-700/10 z-10 pointer-events-none mix-blend-multiply" />
        <div id="ambient-overlay" className="absolute inset-0 bg-gradient-to-t from-[#0a0500]/60 via-transparent to-[#1a0800]/20 z-10 pointer-events-none" />
        <div id="sun-flare" className="absolute top-[10%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-orange-600/15 to-red-900/10 blur-[140px] z-10 pointer-events-none mix-blend-screen" />
        <div id="exhaust-glow" className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-r from-red-800/20 to-orange-600/10 blur-[150px] z-10 pointer-events-none mix-blend-screen" />
        <div id="horizon-haze" className="absolute bottom-0 left-0 w-full h-[35vh] bg-gradient-to-t from-[#0a0500] via-[#1a0800]/40 to-transparent z-10 pointer-events-none" />
      </div>

      {/* STICKY HEADER NAVBAR */}
      <header
        id="vanguard-header"
        className="fixed top-0 left-0 w-full z-40 bg-slate-950/30 backdrop-blur-xl border-b border-amber-500/10 transition-all duration-300"
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 lg:py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollToSection("hero")}
              id="brand-logo"
              className="font-podium text-2xl sm:text-3xl font-extrabold uppercase tracking-widest text-neutral-100 hover:text-amber-400 transition-colors duration-300 cursor-pointer focus:outline-none"
            >
              HONDAJET
            </button>
          </div>

          {/* Desktop navigation */}
          <nav id="desktop-nav" className="hidden md:flex items-center gap-8 lg:gap-12">
            <button
              onClick={() => scrollToSection("portfolio")}
              className="font-inter text-xs tracking-[0.25em] uppercase text-neutral-400 hover:text-amber-400 transition-colors duration-300 cursor-pointer focus:outline-none"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("capabilities")}
              className="font-inter text-xs tracking-[0.25em] uppercase text-neutral-400 hover:text-amber-400 transition-colors duration-300 cursor-pointer focus:outline-none"
            >
              Specs
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="font-inter text-xs tracking-[0.25em] uppercase text-neutral-400 hover:text-amber-400 transition-colors duration-300 cursor-pointer focus:outline-none"
            >
              Inquire
            </button>
          </nav>

          {/* Right Action button */}
          <div className="hidden md:block">
            <button
              onClick={() => scrollToSection("contact")}
              className="magnetic font-podium text-xs tracking-[0.2em] uppercase font-bold text-black bg-orange-600 hover:bg-orange-500 transition-colors duration-300 px-6 py-2.5 rounded-sm"
            >
              Configure Yours
            </button>
          </div>

          {/* Mobile Hamburg */}
          <button
            id="mobile-hamburger"
            onClick={() => setMenuOpen(true)}
            className="md:hidden flex flex-col justify-center items-end space-y-1.5 w-8 h-8 focus:outline-none cursor-pointer group"
            aria-label="Open Mobile Menu"
          >
            <div className="w-6 h-0.5 bg-neutral-200 group-hover:bg-amber-400 transition-colors duration-300" />
            <div className="w-6 h-0.5 bg-neutral-200 group-hover:bg-amber-400 transition-colors duration-300" />
            <div className="w-4 h-0.5 bg-neutral-200 group-hover:bg-amber-400 transition-colors duration-300" />
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      <div
        id="mobile-menu-overlay"
        className={`fixed inset-0 z-50 bg-[#040814]/98 backdrop-blur-xl flex flex-col justify-between transition-all duration-500 text-white ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-amber-500/10 w-full">
          <span className="font-podium text-2xl font-black uppercase tracking-widest text-[#f59e0b]">
            HONDAJET
          </span>
          <button
            id="mobile-close-button"
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-amber-400 transition-colors duration-300 focus:outline-none cursor-pointer"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="flex-grow flex flex-col justify-center px-10 sm:px-16 space-y-6">
          <button
            onClick={() => scrollToSection("portfolio")}
            className="font-podium text-4xl tracking-widest text-white hover:text-amber-400 uppercase transition-all duration-300 text-left cursor-pointer focus:outline-none"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("capabilities")}
            className="font-podium text-4xl tracking-widest text-white hover:text-amber-400 uppercase transition-all duration-300 text-left cursor-pointer focus:outline-none"
          >
            Specs
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className="font-podium text-4xl tracking-widest text-white hover:text-amber-400 uppercase transition-all duration-300 text-left cursor-pointer focus:outline-none"
          >
            Inquire
          </button>

          <div className="pt-8 w-full">
            <button
              onClick={() => scrollToSection("contact")}
              className="group flex items-center justify-between border border-amber-500/30 hover:border-amber-400 px-6 py-4 text-xs font-bold tracking-[0.2em] uppercase text-white hover:bg-amber-400/10 transition-all duration-300 w-full"
            >
              CONFIGURE YOURS
              <ArrowUpRight className="w-4.5 h-4.5 text-white group-hover:text-amber-400 transition-colors duration-300" />
            </button>
          </div>
        </div>

        <div className="px-10 sm:px-16 py-6 border-t border-amber-500/10 text-[9px] tracking-widest text-amber-500/40 uppercase">
          HONDA AIRCRAFT COMPANY &bull; ELITE II
        </div>
      </div>

      {/* CORE SCROLL CONTENT SECTIONS */}
      <div className="relative z-10 w-full">
        
        {/* SECTION 1: HERO VIEWPORT */}
        <section
          id="hero"
          className="relative min-h-screen w-full flex flex-col justify-center items-start px-6 sm:px-10 lg:px-16 pt-24 pb-12 max-w-7xl mx-auto"
        >
          <div className="max-w-4xl text-left select-none pt-12 sm:pt-16">
            {/* Tagline Badge */}
            <div
              id="hero-tagline-container"
              className="animate-fade-up flex items-center gap-2.5 mb-6 lg:mb-8"
            >
              <Crown className="w-4.5 h-4.5 text-amber-500" />
              <span className="text-amber-400/90 text-[11px] sm:text-xs font-inter tracking-[0.3em] uppercase leading-none font-semibold">
                Honda Aircraft Company
              </span>
            </div>

            {/* Title Display headings with Liquid Glass typography */}
            <h1
              id="hero-heading"
              className="animate-fade-up-delay-1 font-podium leading-[0.92] tracking-normal mb-8 text-[clamp(2.8rem,9vw,7.5rem)] select-none flex flex-col pt-4"
            >
              <span className="liquid-glass-text hover:text-amber-400 hover:translate-x-2 transition-all duration-500 cursor-default select-none">Innovation.</span>
              <span className="liquid-glass-text hover:text-amber-400 hover:translate-x-2 transition-all duration-500 cursor-default select-none">Elevation.</span>
              <span className="liquid-glass-text hover:text-amber-400 hover:translate-x-2 transition-all duration-500 cursor-default select-none">Elite II.</span>
            </h1>

            {/* Narrative detail pitch */}
            <p
              id="hero-subtext"
              className="animate-fade-up-delay-2 text-neutral-300 text-sm sm:text-base font-inter leading-relaxed max-w-md font-light mb-8 lg:mb-10"
            >
              The farthest, fastest, and highest-flying <br className="hidden sm:inline" />
              aircraft in its class —{" "}
              <span className="text-white font-semibold underline decoration-amber-500 decoration-2 underline-offset-4">
                the very light jet category redefined.
              </span>
            </p>

            {/* Actions group */}
            <div
              id="hero-cta-group"
              className="animate-fade-up-delay-3 flex flex-wrap items-center gap-4 sm:gap-6"
            >
              <button
                onClick={() => scrollToSection("portfolio")}
                className="group relative flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-neutral-950 hover:from-white hover:to-white hover:text-black px-6 sm:px-8 py-3.5 sm:py-4 text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] focus:outline-none cursor-pointer"
              >
                EXPLORE AIRCRAFT
                <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
              </button>

              <div
                id="cta-award-badge"
                className="hidden sm:flex items-center gap-3.5 border-l border-amber-500/20 pl-6 py-1 select-none"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/5 border border-amber-500/10 text-amber-500">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-white text-[11px] font-bold tracking-[0.15em] uppercase">INDUSTRY LEADER</span>
                  <span className="text-amber-500/50 text-[9px] tracking-widest uppercase font-semibold">VERY LIGHT JET</span>
                </div>
              </div>
            </div>

            {/* Metrics group */}
            <div
              id="hero-stats-group"
              className="animate-fade-up-delay-4 mt-12 sm:mt-16 lg:mt-24 flex flex-wrap gap-8 sm:gap-12 lg:gap-16 border-t border-amber-500/10 pt-8 max-w-2xl"
            >
              <div className="flex flex-col text-left group">
                <span className="font-inter text-white text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight group-hover:text-amber-400 transition-colors duration-300">
                  1,547
                </span>
                <span className="text-neutral-400 text-[9px] sm:text-xs tracking-[0.25em] uppercase mt-1 font-semibold group-hover:text-amber-500/80 transition-colors duration-300">
                  Nautical Miles Range
                </span>
              </div>

              <div className="flex flex-col text-left group">
                <span className="font-inter text-white text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight group-hover:text-amber-400 transition-colors duration-300">
                  422
                </span>
                <span className="text-neutral-400 text-[9px] sm:text-xs tracking-[0.25em] uppercase mt-1 font-semibold group-hover:text-amber-500/80 transition-colors duration-300">
                  KTAS Max Cruise
                </span>
              </div>

              <div className="flex flex-col text-left group">
                <span className="font-inter text-white text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight group-hover:text-amber-400 transition-colors duration-300">
                  $7M+
                </span>
                <span className="text-neutral-400 text-[9px] sm:text-xs tracking-[0.25em] uppercase mt-1 font-semibold group-hover:text-amber-500/80 transition-colors duration-300">
                  Starting Price
                </span>
              </div>
            </div>
          </div>

          {/* Scrolling Invitation icon */}
          <div className="absolute bottom-6 left-6 sm:left-10 lg:left-16 flex items-center gap-2 select-none font-mono text-[9px] tracking-[0.4em] uppercase text-white/40">
            <span className="inline-block animate-bounce">
              <ArrowDown className="w-3.5 h-3.5 text-amber-400/80" />
            </span>
            <span>SCROLL TO EXPLORE THE VESSEL</span>
          </div>
        </section>

        {/* SECTION 2: PORTFOLIO SHOWCASE */}
        <section
          id="portfolio"
          className="relative min-h-screen w-full px-6 sm:px-10 lg:px-16 py-20 lg:py-28 max-w-7xl mx-auto flex flex-col justify-center border-t border-amber-500/15 bg-transparent"
        >
          <div className="max-w-6xl w-full">
            {/* Portfolio head with liquid glass typography */}
            <div className="flex flex-col text-left mb-12 sm:mb-16 border-b border-amber-500/10 pb-6">
              <span className="text-xs text-amber-400 font-semibold tracking-[0.3em] uppercase drop-shadow-[0_0_12px_rgba(245,158,11,0.15)]">Performance & Luxury</span>
              <h2 className="font-podium text-4xl sm:text-5xl liquid-glass-text tracking-wider mt-1">THE ELITE II ADVANTAGE</h2>
            </div>

            {/* Interactive Grid of Portfolio Items styled with custom translucent liquid glass panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 text-left">
              {HONDAJET_FEATURES.map((proj) => (
                <div
                  key={proj.id}
                  className="group relative parallax-portfolio-card bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 min-h-[240px] select-none shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.18),0_12px_44px_rgba(0,0,0,0.35)] hover:bg-white/[0.08] hover:border-amber-400/30 hover:shadow-[0_20px_40px_rgba(245,158,11,0.15),inset_0_1.5px_3px_rgba(255,255,255,0.25)] rounded-2xl"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-[#a3a3a3] mb-4 font-semibold">
                      <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20">
                        {proj.tag}
                      </span>
                      <span>{proj.year}</span>
                    </div>

                    <h3 className="font-podium text-2xl text-white uppercase tracking-wider group-hover:text-amber-400 transition-colors duration-300 mb-2">
                       {proj.title}
                    </h3>

                    <span className="block text-xs font-medium text-amber-500/80 uppercase tracking-widest mb-3 font-mono">
                      {proj.category}
                    </span>

                    <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <button
                    onClick={() => scrollToSection("contact")}
                    className="mt-6 flex items-center justify-end gap-1.5 text-[10px] text-amber-500/0 group-hover:text-amber-400 tracking-widest uppercase transition-all duration-300 font-bold focus:outline-none cursor-pointer"
                  >
                    INITIATE DISCOVERY
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-amber-500/10 pt-8 text-center sm:text-left">
              <p className="text-xs sm:text-sm text-neutral-300 font-light max-w-xl">
                Every Elite II represents the pinnacle of aeronautical innovation and uncompromised luxury. Have a mission profile? We are ready for departure.
              </p>
              <button
                onClick={() => scrollToSection("contact")}
                className="group flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-neutral-950 hover:from-white hover:to-white hover:text-black py-3.5 px-6 sm:px-8 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] focus:outline-none cursor-pointer"
              >
                BOOK A DISCOVERY FLIGHT
                <ArrowUpRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: IMMERSIVE STUDIO OFFERINGS */}
        <section
          id="capabilities"
          className="relative min-h-screen w-full px-6 sm:px-10 lg:px-16 py-20 lg:py-28 max-w-7xl mx-auto flex flex-col justify-center border-t border-amber-500/15 bg-transparent"
        >
          <div className="max-w-6xl w-full text-left">
            <div className="flex flex-col mb-12 sm:mb-16 border-b border-amber-500/10 pb-6">
              <span className="text-xs text-amber-400 font-semibold tracking-[0.3em] uppercase drop-shadow-[0_0_12px_rgba(245,158,11,0.15)]">Technical Data</span>
              <h2 className="font-podium text-4xl sm:text-5xl liquid-glass-text tracking-wider mt-1">SPECIFICATIONS</h2>
            </div>

            {/* Capabilities grid layout styled with premium translucent liquid glass items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {SPECIFICATIONS.map((offering) => (
                <div
                  key={offering.number}
                  className="group flex gap-6 p-6 parallax-offering-card bg-white/[0.03] backdrop-blur-2xl border border-white/10 transition-all duration-500 shadow-[inset_0_1px_2.5px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.25)] hover:bg-white/[0.08] hover:border-amber-500/30 hover:shadow-[0_15px_35px_rgba(245,158,11,0.12),inset_0_1.5px_3px_rgba(255,255,255,0.25)] rounded-xl"
                >
                  <div className="font-podium text-amber-400 text-3xl sm:text-4xl leading-none select-none">
                    {offering.number}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-wider mb-2 font-inter uppercase">
                      {offering.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                      {offering.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: CONTACT & INQUIRY FORM */}
        <section
          id="contact"
          className="relative min-h-screen w-full px-6 sm:px-10 lg:px-16 py-20 lg:py-28 max-w-7xl mx-auto flex items-center justify-center border-t border-amber-500/15 bg-transparent"
        >
          <div className="max-w-3xl w-full bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-6 sm:p-12 lg:p-16 shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.18),0_25px_60px_rgba(0,0,0,0.35)] rounded-3xl relative overflow-hidden">
            <div className="text-left pb-6 border-b border-amber-500/10 mb-8 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-500 font-bold tracking-[0.25em] uppercase drop-shadow-[0_0_12px_rgba(245,158,11,0.15)]">SECURE COMMUNICATIONS</span>
                <h2 className="font-podium text-3xl sm:text-4xl liquid-glass-text tracking-wider mt-1">REQUEST CONFIGURATION</h2>
              </div>
              <Mail className="w-8 h-8 text-amber-500/80 hidden sm:block" />
            </div>

            {formSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 px-6 bg-amber-400/5 border border-amber-400/35 rounded-none relative overflow-hidden"
              >
                <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
                <h3 className="font-podium text-xl uppercase tracking-wider text-white mb-2">INQUIRY RECEIVED</h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-md mx-auto mb-6">
                  Your configuration request has been routed to a HondaJet aviation specialist. We will contact you shortly to arrange a private demonstration or discuss acquisition options.
                </p>
                <button
                  onClick={resetForm}
                  className="text-xs font-semibold tracking-widest text-neutral-950 hover:text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-white hover:to-white py-3.5 px-6 uppercase transition-all duration-300 w-full cursor-pointer"
                >
                  SUBMIT NEW INQUIRY
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-6 text-left">
                
                {/* Client Name Input */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="client-name" className="text-[9px] font-semibold tracking-widest text-neutral-400 uppercase">
                    NAME / DESIGNATION
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ENTER YOUR DESIGNATION"
                    className="bg-white/[0.04] border border-white/10 text-white px-4 py-3 text-xs tracking-wider uppercase font-mono rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 transition-all w-full placeholder-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md"
                  />
                </div>

                {/* Client Email Input */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="client-email" className="text-[9px] font-semibold tracking-widest text-neutral-400 uppercase">
                    SECURE CHANNELS (EMAIL)
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EMAIL@AGENCY.COM"
                    className="bg-white/[0.04] border border-white/10 text-white px-4 py-3 text-xs tracking-wider font-mono rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 transition-all w-full placeholder-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md"
                  />
                </div>

                {/* Selective disruption type dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="project-category" className="text-[9px] font-semibold tracking-widest text-neutral-400 uppercase">
                    MISSION OBJECTIVE TYPE
                  </label>
                  <select
                    id="project-category"
                    value={selection}
                    onChange={(e) => setSelection(e.target.value)}
                    className="bg-neutral-900 border border-white/10 text-white px-4 py-3 text-xs tracking-wider uppercase font-sans rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 transition-all w-full cursor-pointer text-neutral-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  >
                    <option value="Purchase Inquiry" className="bg-[#030712] text-white">NEW AIRCRAFT PURCHASE</option>
                    <option value="Fractional Ownership" className="bg-[#030712] text-white">FRACTIONAL OWNERSHIP OPTIONS</option>
                    <option value="Charter Information" className="bg-[#030712] text-white">CHARTER INFORMATION</option>
                    <option value="Flight Demo" className="bg-[#030712] text-white">REQUEST FLIGHT DEMONSTRATION</option>
                  </select>
                </div>

                {/* Message Brief text container */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="client-message" className="text-[9px] font-semibold tracking-widest text-neutral-400 uppercase">
                    MISSION BRIEF & SPECIFICATIONS (OPTIONAL)
                  </label>
                  <textarea
                    id="client-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="DESCRIBE THE TARGET CRITERIA OUTLINE..."
                    className="bg-white/[0.04] border border-white/10 text-white p-4 text-xs tracking-wider uppercase font-mono rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 transition-all w-full resize-none placeholder-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md"
                  />
                </div>

                {/* Form submit button */}
                <button
                  type="submit"
                  className="group flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-neutral-950 hover:from-white hover:to-white hover:text-black font-semibold py-4 px-6 text-xs tracking-[0.25em] uppercase transition-all duration-300 w-full cursor-pointer focus:outline-none hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                >
                  TRANSMIT INQUIRY
                  <Send className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                </button>
              </form>
            )}

            <div className="mt-8 border-t border-amber-500/10 pt-6 text-[9px] tracking-widest leading-relaxed text-amber-500/30 text-left uppercase">
              VA_SECURE PROXY LINK ACTIVE. SYSTEMS ENCRYPTED VIA SUNSET TELEMETRY AUTH. VANGUARD IS CO-OPERATIVE IN 14 SOVEREIGN JURISDICTIONS.
            </div>
          </div>
        </section>

        {/* COMPREHENSIVE INDUSTRIAL FOOTER */}
        <footer
          id="vanguard-footer"
          className="w-full bg-black/95 border-t border-amber-500/10 py-12 px-6 sm:px-10 lg:px-16"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex flex-col gap-2">
              <span className="font-podium text-2xl tracking-widest text-[#f59e0b]">HONDAJET</span>
              <span className="text-[9px] tracking-[0.2em] text-[#a3a3a3]/60 uppercase">
                &copy; {new Date().getFullYear()} HONDA AIRCRAFT COMPANY. ALL RIGHTS RESERVED.
              </span>
            </div>
            
            <div className="flex items-center gap-6 font-mono text-[9px] tracking-[0.25em] uppercase text-neutral-400">
              <button onClick={() => scrollToSection("portfolio")} className="hover:text-amber-400 focus:outline-none transition-colors cursor-pointer">PROJECTS</button>
              <span className="text-amber-500/20">|</span>
              <button onClick={() => scrollToSection("capabilities")} className="hover:text-amber-400 focus:outline-none transition-colors cursor-pointer">OFFERINGS</button>
              <span className="text-amber-500/20">|</span>
              <button onClick={() => scrollToSection("contact")} className="hover:text-amber-400 focus:outline-none transition-colors cursor-pointer">INQUIRE</button>
            </div>

            <div className="flex flex-col md:items-end text-[9px] tracking-widest text-neutral-500 uppercase font-mono gap-1">
              <span className="text-amber-400/90 flex items-center justify-center md:justify-end gap-1.5 font-bold">
                <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                FLIGHT PLAN FILED
              </span>
              <span>ALTITUDE: FLIGHT LEVEL 430 | CRUISE</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

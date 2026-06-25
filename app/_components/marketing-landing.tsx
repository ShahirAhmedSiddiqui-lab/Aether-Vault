'use client';

import { motion } from 'motion/react';
import { ArrowRight, Bot, Layers, Sparkles } from 'lucide-react';
import { BrandLockup } from './brand-lockup';

export function MarketingLanding() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans relative antialiased flex flex-col justify-between overflow-x-hidden">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center shrink-0 border-b border-neutral-100"
      >
        <BrandLockup size="md" />
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={() => {
              window.location.assign('/login');
            }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition-premium font-mono"
          >
            LOGIN
          </motion.button>
          <motion.button
            onClick={() => {
              window.location.assign('/login');
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            className="px-4 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-extrabold rounded-full transition-premium font-mono border border-neutral-950 shadow-xs"
          >
            GET STARTED
          </motion.button>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-center text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-neutral-950 font-sans max-w-3xl mx-auto leading-none">
            Save everything.
            <br />
            Find it in seconds.
          </h1>
          <p className="text-sm md:text-base text-neutral-500 max-w-lg mx-auto leading-relaxed">
            People save YouTube videos, social links, articles, PDFs, screenshots, and notes - then lose
            them forever. Memora listens, transcribes, and maps your knowledge instantly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.button
            onClick={() => {
              window.location.assign('/login');
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            className="w-full sm:w-auto bg-neutral-950 hover:bg-neutral-850 text-white text-sm font-bold px-8 py-3 rounded-xl transition-premium shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Explore My Brain Vault</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </motion.button>
          <motion.button
            onClick={() => {
              window.location.assign('/login');
            }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="w-full sm:w-auto bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-semibold px-6 py-3 rounded-xl shadow-xs transition-premium cursor-pointer"
          >
            Quick Capture Link
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
            whileHover={{ y: -4 }}
            className="bg-neutral-50 border border-neutral-200/80 p-6 rounded-2xl space-y-3 shadow-2xs hover:border-neutral-300 transition-premium"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-neutral-200 shadow-2xs">
              <Sparkles className="w-4 h-4 text-neutral-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 text-xs tracking-wider uppercase font-mono">1. Auto-Synthesis</h3>
              <p className="text-neutral-500 text-[11px] leading-relaxed mt-1">
                Gemini 2.5 Flash inspects links, PDFs, screenshots, and audio recordings, drawing raw main
                takeaways, executive summaries, and action steps in real-time.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
            whileHover={{ y: -4 }}
            className="bg-neutral-50 border border-neutral-200/80 p-6 rounded-2xl space-y-3 shadow-2xs hover:border-neutral-300 transition-premium"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-neutral-200 shadow-2xs">
              <Layers className="w-4 h-4 text-neutral-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 text-xs tracking-wider uppercase font-mono">2. Recall Flashcards</h3>
              <p className="text-neutral-500 text-[11px] leading-relaxed mt-1">
                AI automatically generates custom dynamic learning cards with interactive flip states to test your
                recall of everything you saved.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.34 }}
            whileHover={{ y: -4 }}
            className="bg-neutral-50 border border-neutral-200/80 p-6 rounded-2xl space-y-3 shadow-2xs hover:border-neutral-300 transition-premium"
          >
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-neutral-200 shadow-2xs">
              <Bot className="w-4 h-4 text-neutral-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 text-xs tracking-wider uppercase font-mono">3. Chat with Knowledge</h3>
              <p className="text-neutral-500 text-[11px] mt-1 leading-relaxed">
                Ask, &ldquo;What restaurant startup idea was saved 3 months ago?&rdquo; and semantic matching locates the exact
                asset instantly.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-6 pb-2 border-t border-neutral-100 flex flex-wrap items-center justify-center gap-6 text-[10px] text-neutral-400 font-mono tracking-widest uppercase"
        >
          <span>SAVING OPTIONS:</span>
          <span className="text-neutral-900 font-bold">&bull; YouTube videos</span>
          <span className="text-neutral-900 font-bold">&bull; PDF Papers</span>
          <span className="text-neutral-900 font-bold">&bull; Screenshots & images</span>
          <span className="text-neutral-900 font-bold">&bull; Voice Notes / MP3</span>
          <span className="text-neutral-900 font-bold">&bull; Social links</span>
          <span className="text-neutral-900 font-bold">&bull; Articles & web-text</span>
        </motion.div>
      </main>

      <footer className="animate-memora-fade-in py-6 border-t border-neutral-100 text-center text-[10px] text-neutral-400 font-mono tracking-widest shrink-0">
        MEMORA CORE &copy; {new Date().getFullYear()} &bull; POWERED BY GOOGLE GEMINI 2.5 FLASH
      </footer>
    </div>
  );
}

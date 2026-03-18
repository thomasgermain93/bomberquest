import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import SectionLabel from './SectionLabel';
import { FAQ_ITEMS } from '@/data/faq';

const FaqSection: React.FC = () => (
  <section id="faq" className="py-24 sm:py-32 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12 md:gap-20">
        {/* Left — title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="md:w-2/5"
        >
          <SectionLabel text="FAQ" />
          <h2 className="font-pixel text-sm sm:text-xl text-foreground leading-tight">
            TES QUESTIONS,{' '}
            <span className="text-primary">NOS RÉPONSES</span>
          </h2>
          <p className="text-base text-muted-foreground mt-4 leading-relaxed">
            Tu as une autre question ? Rejoins la communauté ou consulte le Wiki.
          </p>
        </motion.div>

        {/* Right — accordion */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="md:w-3/5"
        >
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="pixel-border bg-card px-4 border-b-0"
              >
                <AccordionTrigger className="font-pixel text-[8px] text-foreground hover:no-underline hover:text-primary py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </div>
  </section>
);

export default FaqSection;

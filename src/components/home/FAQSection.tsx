'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export default function FAQSection({ faqs = [] }: { faqs?: FAQItem[] }) {
  // Collapsed by default on mobile to save vertical scrolling length
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const defaultFaqs: FAQItem[] = [
    {
      id: '1',
      question: 'How often should I apply Herbic Cure 21 Herbs Fusion Hair Oil?',
      answer:
        'For optimal root strengthening, apply 2 to 3 times a week before sleeping or 1-2 hours prior to shampooing. Warm the oil gently in your palms and massage deep into the scalp using our Neem Wood Comb.',
    },
    {
      id: '2',
      question: 'Is Herbic Cure suitable for both men and women?',
      answer:
        'Yes! Our 100% Ayurvedic formulation contains 21 medicinal herbs (Bhringraj, Brahmi, Amla, Jatamansi, Neem) designed to address DHT-induced hair fall, receding hairline, dandruff, and split ends for all hair types and genders.',
    },
    {
      id: '3',
      question: 'Does the Shampoo contain Sulfates, Parabens, or Artificial Colors?',
      answer:
        'Zero chemicals, zero mineral oils, zero silicones, zero artificial dyes. Herbic Cure Shampoo with Conditioner is formulated with plant-derived surfactants and enriched with Argan Oil and Shea Butter for gentle clarifying without stripping natural moisture.',
    },
    {
      id: '4',
      question: 'How quickly can I expect to see visible results?',
      answer:
        'Most users report a marked reduction in hair fall within 14 to 21 days. Baby hair regrowth and noticeable scalp density typically manifest between 60 to 90 days of consistent usage.',
    },
    {
      id: '5',
      question: 'Can I pay via Cash on Delivery (COD)?',
      answer:
        'Yes, Cash on Delivery is available across all serviceable pin codes in India alongside instant secure UPI, Debit/Credit cards, and Net Banking.',
    },
  ];

  const items = faqs && faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <section className="py-7 sm:py-20 bg-white border-b border-stone-200/60">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-4 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#A84358] bg-rose-100/70 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2.5">
            <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-700" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl mx-auto">
            Everything you need to know about our herbal formulations, application ritual, and delivery.
          </p>
        </div>

        <div className="space-y-2.5 sm:space-y-3.5">
          {items.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.id}
                className="border border-stone-200/90 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 hover:border-rose-700/40"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left p-3.5 sm:p-5 flex items-center justify-between gap-3 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                >
                  <span className="font-bold text-xs sm:text-base text-stone-900 pr-1">
                    {faq.question}
                  </span>
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? 'bg-[#A84358] text-white rotate-180'
                        : 'bg-stone-200/80 text-stone-600'
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="p-3.5 pt-1.5 sm:p-5 sm:pt-2 text-xs sm:text-sm text-stone-600 leading-relaxed bg-white border-t border-stone-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

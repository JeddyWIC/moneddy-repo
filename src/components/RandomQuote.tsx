"use client";

import { useState, useEffect } from "react";

const quotes = [
  // Stoic
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "He who fears death will never do anything worthy of a living man.", author: "Seneca" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "It is not that we have a short time to live, but that we waste a great deal of it.", author: "Seneca" },
  { text: "The best revenge is not to be like your enemy.", author: "Marcus Aurelius" },
  { text: "Man is not worried by real problems so much as by his imagined anxieties about real problems.", author: "Epictetus" },
  { text: "If it is not right, do not do it. If it is not true, do not say it.", author: "Marcus Aurelius" },
  { text: "Difficulty shows what men are.", author: "Epictetus" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },

  // Churchill
  { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The price of greatness is responsibility.", author: "Winston Churchill" },
  { text: "Attitude is a little thing that makes a big difference.", author: "Winston Churchill" },
  { text: "To improve is to change; to be perfect is to change often.", author: "Winston Churchill" },
  { text: "You will never reach your destination if you stop and throw stones at every dog that barks.", author: "Winston Churchill" },

  // Founding Fathers
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "By failing to prepare, you are preparing to fail.", author: "Benjamin Franklin" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "It is in the character of very few men to honor without envy a friend who has prospered.", author: "John Adams" },
  { text: "The harder the conflict, the greater the triumph.", author: "George Washington" },
  { text: "Discipline is the soul of an army.", author: "George Washington" },
  { text: "I am a great believer in luck, and I find the harder I work the more I have of it.", author: "Thomas Jefferson" },
  { text: "In matters of style, swim with the current; in matters of principle, stand like a rock.", author: "Thomas Jefferson" },
  { text: "Nothing can stop the man with the right mental attitude from achieving his goal.", author: "Thomas Jefferson" },

  // Kierkegaard
  { text: "Life can only be understood backwards; but it must be lived forwards.", author: "Kierkegaard" },
  { text: "The most common form of despair is not being who you are.", author: "Kierkegaard" },
  { text: "People demand freedom of speech as a compensation for the freedom of thought which they seldom use.", author: "Kierkegaard" },
  { text: "Anxiety is the dizziness of freedom.", author: "Kierkegaard" },

  // Plato & Aristotle
  { text: "The measure of a man is what he does with power.", author: "Plato" },
  { text: "Wise men speak because they have something to say; fools because they have to say something.", author: "Plato" },
  { text: "Be kind, for everyone you meet is fighting a hard battle.", author: "Plato" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "Patience is bitter, but its fruit is sweet.", author: "Aristotle" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },

  // Biblical & Judaic
  { text: "Where there is no vision, the people perish.", author: "Proverbs 29:18" },
  { text: "Iron sharpens iron, and one man sharpens another.", author: "Proverbs 27:17" },
  { text: "The fear of the Lord is the beginning of wisdom.", author: "Proverbs 9:10" },
  { text: "Train up a child in the way he should go; even when he is old he will not depart from it.", author: "Proverbs 22:6" },
  { text: "A wise man is strong, and a man of knowledge increases power.", author: "Proverbs 24:5" },
  { text: "Plans fail for lack of counsel, but with many advisers they succeed.", author: "Proverbs 15:22" },
  { text: "Commit your work to the Lord, and your plans will be established.", author: "Proverbs 16:3" },
  { text: "Whatever your hand finds to do, do it with your might.", author: "Ecclesiastes 9:10" },
  { text: "To everything there is a season, and a time to every purpose under heaven.", author: "Ecclesiastes 3:1" },
  { text: "You are not obligated to complete the work, but neither are you free to desist from it.", author: "Rabbi Tarfon, Pirkei Avot 2:16" },
  { text: "Who is wise? He who learns from every person.", author: "Pirkei Avot 4:1" },
  { text: "In a place where there are no men, strive to be a man.", author: "Pirkei Avot 2:5" },
  { text: "Do not be daunted by the enormity of the world's grief.", author: "Rabbi Tarfon" },

  // Other timeless
  { text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "It is not the critic who counts; not the man who points out how the strong man stumbles.", author: "Theodore Roosevelt" },
  { text: "The world breaks everyone, and afterward, many are strong at the broken places.", author: "Ernest Hemingway" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
];

export default function RandomQuote() {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  if (!quote) return null;

  return (
    <div className="text-center mb-8 max-w-2xl mx-auto">
      <p className="text-lg italic text-stone-600 dark:text-stone-400 leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-sm text-stone-400 dark:text-stone-500 mt-2">
        &mdash; {quote.author}
      </p>
    </div>
  );
}

// Popular Hinglish food-related movie dialogues
export const foodQuotes = [
  {
    text: "Khaana khaoge? Ghar ka khana hai, bahar ka nahi",
    movie: "3 Idiots",
    context: "home_cooking"
  },
  {
    text: "Rasoi mein maa ka pyaar hota hai, bahar sirf business",
    movie: "Anand",
    context: "motherly_love"
  },
  {
    text: "Meetha khayenge toh meetha bolenge na",
    movie: "Hum Aapke Hain Koun",
    context: "sweets"
  },
  {
    text: "Bhookh lagi hai? Toh khaana kha lo, simple!",
    movie: "Munna Bhai MBBS",
    context: "hunger"
  },
  {
    text: "Ghar ka nashta ho ya bahar ka, dil se khana chahiye",
    movie: "Taare Zameen Par",
    context: "breakfast"
  },
  {
    text: "Chai peene se sab theek ho jaata hai",
    movie: "Zindagi Na Milegi Dobara",
    context: "tea_time"
  },
  {
    text: "Mithai bhi life ki tarah honi chahiye - meethi aur yaadgar",
    movie: "Queen",
    context: "celebrations"
  },
  {
    text: "Khushiyan baantne se badhti hain, bilkul mithai ki tarah",
    movie: "Dangal",
    context: "sharing"
  },
  {
    text: "Arre yaar, biscuit ke bina chai kaisi?",
    movie: "Golmaal",
    context: "tea_biscuits"
  },
  {
    text: "Cake kaatne se pehle wish karna zaroori hai",
    movie: "Kuch Kuch Hota Hai",
    context: "birthday"
  }
];

export const getRandomFoodQuote = (context?: string) => {
  const filteredQuotes = context 
    ? foodQuotes.filter(quote => quote.context === context)
    : foodQuotes;
  
  const quotes = filteredQuotes.length > 0 ? filteredQuotes : foodQuotes;
  return quotes[Math.floor(Math.random() * quotes.length)];
};
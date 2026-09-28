interface TriviaQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface TriviaResponse {
  response_code: number;
  results: TriviaQuestion[];
}

// Map eco topics to Open Trivia Database category IDs
const TOPIC_TO_CATEGORY_MAP: Record<string, number> = {
  basics: 17, // Science & Nature (closest to environmental basics)
  energy: 17, // Science & Nature
  waste: 17, // Science & Nature
  water: 17, // Science & Nature
  biodiversity: 17, // Science & Nature
  // Alternative mappings for more variety:
  // basics: 18, // Science: Computers (for tech aspects of eco solutions)
  // energy: 30, // Science: Gadgets (for renewable energy tech)
  // Add more mappings as needed
};

export const fetchTriviaQuestions = async (
  amount: number = 10,
  category?: number,
  difficulty?: 'easy' | 'medium' | 'hard'
): Promise<TriviaQuestion[]> => {
  try {
    const params = new URLSearchParams({
      amount: amount.toString(),
    });

    if (category) {
      params.append('category', category.toString());
    }

    if (difficulty) {
      params.append('difficulty', difficulty.toString());
    }

    const response = await fetch(`https://opentdb.com/api.php?${params}`);
    const data: TriviaResponse = await response.json();

    if (data.response_code !== 0) {
      throw new Error('Failed to fetch trivia questions');
    }

    return data.results;
  } catch (error) {
    console.error('Error fetching trivia questions:', error);
    return [];
  }
};

export const fetchTopicRelatedQuestions = async (
  topic: string,
  amount: number = 10
): Promise<TriviaQuestion[]> => {
  // Map eco topics to relevant trivia categories
  const categoryId = TOPIC_TO_CATEGORY_MAP[topic];

  if (categoryId) {
    // Try to get questions from the mapped category
    const questions = await fetchTriviaQuestions(amount, categoryId);
    if (questions.length > 0) {
      return questions;
    }
  }

  // For eco topics, try multiple categories to get more relevant questions
  const ecoCategories = [17, 18, 19, 30]; // Science & Nature, Computers, Mathematics, Gadgets
  for (const catId of ecoCategories) {
    const questions = await fetchTriviaQuestions(amount, catId);
    if (questions.length > 0) {
      return questions;
    }
  }

  // Final fallback: get general questions if no specific category mapping
  return fetchTriviaQuestions(amount);
};

export const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const formatTriviaQuestion = (triviaQuestion: TriviaQuestion) => {
  return {
    question: decodeHtmlEntities(triviaQuestion.question),
    options: [
      decodeHtmlEntities(triviaQuestion.correct_answer),
      ...triviaQuestion.incorrect_answers.map(decodeHtmlEntities)
    ].sort(() => Math.random() - 0.5), // Shuffle options
    correctAnswer: decodeHtmlEntities(triviaQuestion.correct_answer),
    explanation: `This is a ${triviaQuestion.difficulty} question from the ${decodeHtmlEntities(triviaQuestion.category)} category.`,
    category: decodeHtmlEntities(triviaQuestion.category),
    difficulty: triviaQuestion.difficulty
  };
};
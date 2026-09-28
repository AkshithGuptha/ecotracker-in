
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Check, X, Award, Lightbulb, Earth, Star } from "lucide-react";
import { addPoints, scopedKey } from "@/lib/carbon";
import { fetchTopicRelatedQuestions, formatTriviaQuestion } from "@/services/triviaApi";

const LearnQuiz = () => {
  const [activeTopic, setActiveTopic] = useState("all");
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [completedMap, setCompletedMap] = useState<Record<string, { score: number; completedAt: number }>>({});
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // storage helpers
  const COMPLETED_KEY = scopedKey("quiz:completed");
  const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
  const loadCompleted = () => {
    try {
      const raw = localStorage.getItem(COMPLETED_KEY);
      const parsed: Record<string, any> = raw ? JSON.parse(raw) : {};
      // Normalize old entries without completedAt
      const normalized: Record<string, { score: number; completedAt: number }> = {};
      Object.keys(parsed || {}).forEach((k) => {
        const v = parsed[k] || {};
        normalized[k] = {
          score: typeof v.score === 'number' ? v.score : 0,
          completedAt: typeof v.completedAt === 'number' ? v.completedAt : Date.now()
        };
      });
      return normalized;
    } catch {
      return {};
    }
  };
  const saveCompleted = (map: Record<string, { score: number; completedAt: number }>) => {
    try { localStorage.setItem(COMPLETED_KEY, JSON.stringify(map)); } catch {}
  };
  useEffect(() => { setCompletedMap(loadCompleted()); }, []);
  // live ticker for countdown (re-render every second)
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const canAttempt = (quizId: string | number) => {
    const rec = completedMap[String(quizId)];
    if (!rec) return true;
    return Date.now() - rec.completedAt >= COOLDOWN_MS;
  };

  const remainingTime = (quizId: string | number) => {
    const rec = completedMap[String(quizId)];
    if (!rec) return 0;
    const rem = COOLDOWN_MS - (Date.now() - rec.completedAt);
    return Math.max(0, rem);
  };

  const formatRemaining = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const topics = [
    { id: "all", name: "All Topics" },
    { id: "basics", name: "Eco Basics" },
    { id: "energy", name: "Energy" },
    { id: "waste", name: "Waste" },
    { id: "water", name: "Water" },
    { id: "biodiversity", name: "Biodiversity" }
  ];

  // Base quizzes (questionCount, meta)
  const quizzes = [
    {
      id: 1,
      title: "Climate Change Basics",
      description: "Test your knowledge about climate change causes and effects",
      topic: "basics",
      difficulty: "Beginner",
      points: 50,
      questionCount: 5,
      duration: "5 min",
      completed: false,
      image: "🌍",
      questions: []
    },
    {
      id: 2,
      title: "Renewable Energy",
      description: "Learn about clean energy sources and technologies",
      topic: "energy",
      difficulty: "Intermediate",
      points: 75,
      questionCount: 5,
      duration: "8 min",
      completed: false,
      score: 80,
      image: "⚡",
      questions: []
    },
    {
      id: 3,
      title: "Waste Management",
      description: "Test your knowledge of recycling and composting",
      topic: "waste",
      difficulty: "Beginner",
      points: 40,
      questionCount: 4,
      duration: "4 min",
      completed: false,
      image: "♻️",
      questions: []
    },
    {
      id: 4,
      title: "Water Conservation",
      description: "Learn how to save water in daily activities",
      topic: "water",
      difficulty: "Beginner",
      points: 35,
      questionCount: 3,
      duration: "3 min",
      completed: false,
      image: "💧",
      questions: []
    },
    {
      id: 5,
      title: "Biodiversity Importance",
      description: "Understand why biodiversity matters for our planet",
      topic: "biodiversity",
      difficulty: "Advanced",
      points: 100,
      questionCount: 8,
      duration: "12 min",
      completed: false,
      image: "🌿",
      questions: []
    },
    {
      id: 6,
      title: "Carbon Footprint",
      description: "Calculate and reduce your personal carbon impact",
      topic: "basics",
      difficulty: "Intermediate",
      points: 60,
      questionCount: 5,
      duration: "6 min",
      completed: false,
      score: 100,
      image: "👣",
      questions: []
    }
  ];

  const ecoTips = [
    {
      id: 1,
      title: "Unplug Electronics",
      description: "Unplugging unused electronics can save up to 10% of your energy usage.",
      category: "energy",
      points: 5,
      read: false
    },
    {
      id: 2,
      title: "Skip the Beef",
      description: "Reducing beef consumption by just one meal per week can save water equivalent to 100 showers.",
      category: "basics",
      points: 5,
      read: true
    },
    {
      id: 3,
      title: "Use Cold Water",
      description: "Washing clothes in cold water can reduce energy usage by up to 90% per load.",
      category: "water",
      points: 5,
      read: false
    }
  ];

  // Thematic question banks
  const banks: Record<string, Array<{question: string; options: string[]; correctAnswer: string; explanation: string;}>> = {
    basics: [
      { question: "Main greenhouse gas?", options: ["CO₂","N₂","O₂","H₂"], correctAnswer: "CO₂", explanation: "CO₂ is the primary greenhouse gas." },
      { question: "Paris Agreement is?", options: ["Tourism pact","Climate treaty","Trade deal","Space partnership"], correctAnswer: "Climate treaty", explanation: "Treaty to mitigate climate change." },
      { question: "Earth's water surface?", options: ["50%","60%","70%","80%"], correctAnswer: "70%", explanation: "About 71% of Earth's surface is water." },
      { question: "Largest emission sector?", options: ["Transport","Electricity","Agriculture","Heating"], correctAnswer: "Electricity", explanation: "Electricity production is the largest share globally." },
      { question: "Ocean issue from CO₂?", options: ["Alkalization","Acidification","Freezing","Evaporation"], correctAnswer: "Acidification", explanation: "CO₂ dissolves increasing acidity." },
    ],
    energy: [
      { question: "Which is renewable?", options: ["Coal","Wind","Diesel","Gas"], correctAnswer: "Wind", explanation: "Wind is a renewable source." },
      { question: "Solar panels generate?", options: ["Heat","Electricity","Water","Fuel"], correctAnswer: "Electricity", explanation: "PV converts light to electricity." },
      { question: "Energy efficiency unit?", options: ["kWh","L/100km","dB","ppm"], correctAnswer: "kWh", explanation: "Household energy is in kWh." },
      { question: "LED vs Incandescent savings?", options: ["20%","50%","80%","5%"], correctAnswer: "80%", explanation: "LEDs use up to 80% less energy." },
      { question: "Net metering relates to?", options: ["Wind","Hydro","Solar","Coal"], correctAnswer: "Solar", explanation: "Excess solar fed to grid is net metering." },
    ],
    waste: [
      { question: "Compostable?", options: ["Banana peel","Plastic bag","Glass","Metal"], correctAnswer: "Banana peel", explanation: "Organic waste composts." },
      { question: "Recycle symbol number for PET?", options: ["1","2","4","7"], correctAnswer: "1", explanation: "PET is #1." },
      { question: "E-waste example?", options: ["Bottle","Newspaper","Phone","Banana"], correctAnswer: "Phone", explanation: "Phones are e-waste." },
      { question: "Best reduce strategy?", options: ["Buy more","Reuse","Landfill","Incinerate"], correctAnswer: "Reuse", explanation: "Reuse reduces waste." },
      { question: "Compost needs?", options: ["Plastic","Oxygen","Mercury","Acid"], correctAnswer: "Oxygen", explanation: "Aerobic composting needs oxygen." },
    ],
    water: [
      { question: "Largest freshwater use?", options: ["Industry","Agriculture","Domestic","Mining"], correctAnswer: "Agriculture", explanation: "Agriculture uses most freshwater." },
      { question: "Efficient faucets use?", options: ["Aerators","Heaters","Filters","Softeners"], correctAnswer: "Aerators", explanation: "Aerators reduce flow." },
      { question: "Rainwater harvesting stores?", options: ["Sewage","Stormwater","Potable only","None"], correctAnswer: "Stormwater", explanation: "Collects runoff for reuse." },
      { question: "Greywater comes from?", options: ["Toilets","Showers","Industrial","Garden"], correctAnswer: "Showers", explanation: "Sinks/showers are greywater." },
      { question: "Leaks waste?", options: ["No","Some","A lot","None"], correctAnswer: "A lot", explanation: "Fix leaks to save water." },
    ],
    biodiversity: [
      { question: "Biodiversity means?", options: ["One species","All life variety","Only plants","Only animals"], correctAnswer: "All life variety", explanation: "Variety of life on Earth." },
      { question: "Habitat loss causes?", options: ["Extinction","Growth","Migration only","No effect"], correctAnswer: "Extinction", explanation: "Leads to species extinction." },
      { question: "Pollinators include?", options: ["Bees","Sharks","Worms","Lions"], correctAnswer: "Bees", explanation: "Bees pollinate plants." },
      { question: "Invasive species are?", options: ["Native","Beneficial","Non-native harmful","Endangered"], correctAnswer: "Non-native harmful", explanation: "Harm local ecosystems." },
      { question: "Conservation areas?", options: ["Protected","Urban","Industrial","Agricultural"], correctAnswer: "Protected", explanation: "Protected areas conserve biodiversity." },
    ],
  };

  const pickQuestions = async (topic: string, count: number) => {
    // Try to fetch topic-related questions from Open Trivia Database first
    try {
      const triviaQuestions = await fetchTopicRelatedQuestions(topic, count);
      if (triviaQuestions.length > 0) {
        return triviaQuestions.map(formatTriviaQuestion);
      }
    } catch (error) {
      console.warn('Failed to fetch trivia questions, falling back to local questions:', error);
    }

    // Fallback to local questions if API fails
    const pool = banks[topic] || banks.basics;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };
  const filteredQuizzes = activeTopic === "all"
    ? quizzes
    : quizzes.filter((quiz) => quiz.topic === activeTopic);

  const handleStartQuiz = async (quiz: any) => {
    // block if on cooldown
    if (!canAttempt(quiz.id)) return;

    setIsLoadingQuestions(true);
    try {
      // Generate question set per theme
      const questions = await pickQuestions(quiz.topic, quiz.questionCount);
      setActiveQuiz({ ...quiz, questions });
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      // Fallback to local questions if API fails
      const fallbackQuestions = pickQuestions(quiz.topic, quiz.questionCount);
      setActiveQuiz({ ...quiz, questions: fallbackQuestions });
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswerChecked) {
      setSelectedAnswer(answer);
    }
  };

  const checkAnswer = () => {
    if (!selectedAnswer || isAnswerChecked) return;
    
    setIsAnswerChecked(true);
    
    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      // Quiz completed (persist & start cooldown)
      const finalScore = Math.round((quizScore + (selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer ? 1 : 0)) / activeQuiz.questions.length * 100);
      const next = { ...completedMap, [String(activeQuiz.id)]: { score: finalScore, completedAt: Date.now() } };
      setCompletedMap(next);
      saveCompleted(next);
      // Award points proportionally to score
      const base = Number(activeQuiz.points || 0);
      const awarded = Math.max(0, Math.round(base * (finalScore / 100)));
      if (awarded > 0) {
        try { addPoints(awarded); } catch {}
      }
      setActiveQuiz({ ...activeQuiz, completed: true, score: finalScore, awardedPoints: awarded });
    }
  };

  const getCurrentQuestion = () => {
    return activeQuiz?.questions[currentQuestionIndex];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learn & Quiz</h1>
            <p className="text-gray-600">Expand your knowledge about sustainability and earn points</p>
          </div>
        </div>

        {/* Topic Filter */}
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Button
              key={topic.id}
              variant={activeTopic === topic.id ? "default" : "outline"}
              onClick={() => setActiveTopic(topic.id)}
              className={activeTopic === topic.id ? "bg-green-600 hover:bg-green-700" : ""}
              size="sm"
            >
              {topic.name}
            </Button>
          ))}
        </div>

        {/* Quizzes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Eco Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredQuizzes.map((quiz) => {
              const rec = completedMap[String(quiz.id)];
              const locked = rec ? !canAttempt(quiz.id) : false;
              const doneScore = rec?.score;
              return (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="text-4xl mb-2">{quiz.image}</div>
                    {rec && (
                      <Badge className="bg-green-100 text-green-800">
                        {doneScore}% Score
                      </Badge>
                    )}
                  </div>
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{quiz.questionCount} questions</span>
                    <span>{quiz.duration}</span>
                    <span className="capitalize">{quiz.difficulty}</span>
                  </div>
                  <div className="mt-auto">
                    <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className={`w-full ${locked ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                        onClick={() => !locked && handleStartQuiz(quiz)}
                        disabled={locked || isLoadingQuestions}
                      >
                        {locked ? `Available in ${formatRemaining(remainingTime(quiz.id))}` : isLoadingQuestions ? "Loading Questions..." : (rec ? "Start Again" : "Start Quiz")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl w-full max-w-[900px] h-[88vh] overflow-hidden">
                      {activeQuiz && activeQuiz.id === quiz.id && !activeQuiz.completed && getCurrentQuestion() && (
                        <div className="flex flex-col h-full min-h-0">
                          {/* Header (non-scrolling) */}
                          <div className="px-2 pt-3">
                            <DialogHeader className="pb-2">
                              <DialogTitle className="flex items-center space-x-2">
                                <Earth className="h-5 w-5 text-green-600" />
                                <span>{activeQuiz.title}</span>
                              </DialogTitle>
                              <DialogDescription>
                                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                              </DialogDescription>
                            </DialogHeader>
                            <Progress value={(currentQuestionIndex / activeQuiz.questions.length) * 100} className="mb-2" />
                          </div>

                          {/* Scrollable Body */}
                          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
                            <div className="space-y-6">
                              <h3 className="text-xl font-semibold">
                                {getCurrentQuestion().question}
                              </h3>
                              <div className="space-y-4">
                                {getCurrentQuestion().options.map((option: string) => (
                                  <Button
                                    key={option}
                                    variant="outline"
                                    onClick={() => handleAnswerSelect(option)}
                                    className={`w-full justify-start text-left h-auto py-3 px-5 rounded-lg ${
                                      selectedAnswer === option 
                                        ? isAnswerChecked 
                                          ? option === getCurrentQuestion().correctAnswer
                                            ? "border-green-500 bg-green-50"
                                            : "border-red-500 bg-red-50"
                                          : "border-green-300 bg-green-50" 
                                        : ""
                                    } ${
                                      isAnswerChecked && option === getCurrentQuestion().correctAnswer
                                        ? "border-green-500 bg-green-50"
                                        : ""
                                    }`}
                                    disabled={isAnswerChecked}
                                  >
                                    {isAnswerChecked && option === getCurrentQuestion().correctAnswer && (
                                      <Check className="h-5 w-5 text-green-500 mr-2" />
                                    )}
                                    {isAnswerChecked && selectedAnswer === option && option !== getCurrentQuestion().correctAnswer && (
                                      <X className="h-5 w-5 text-red-500 mr-2" />
                                    )}
                                    {option}
                                  </Button>
                                ))}
                              </div>
                              
                              {isAnswerChecked && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                  <div className="flex items-start space-x-2">
                                    <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                                    <div>
                                      <p className="font-medium text-blue-900">Explanation</p>
                                      <p className="text-sm text-blue-800">
                                        {getCurrentQuestion().explanation}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Fixed Footer (always visible) */}
                          <div className="px-2 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                            {!isAnswerChecked ? (
                              <Button 
                                onClick={checkAnswer} 
                                disabled={!selectedAnswer}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                Submit Answer
                              </Button>
                            ) : (
                              <Button 
                                onClick={goToNextQuestion} 
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                {currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Next Question' : 'See Results'}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {activeQuiz && activeQuiz.id === quiz.id && activeQuiz.completed && (
                        <div className="h-full overflow-y-auto px-2 pb-3">
                          <DialogHeader>
                            <DialogTitle className="text-center">Quiz Completed!</DialogTitle>
                          </DialogHeader>
                          <div className="py-6 flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center mb-4">
                              <div className="text-center">
                                <div className="text-4xl font-bold text-green-700">{activeQuiz.score}%</div>
                                <div className="text-sm text-green-600">Score</div>
                              </div>
                            </div>
                            
                            <div className="text-center mb-6">
                              <h3 className="text-lg font-medium mb-2">
                                {activeQuiz.score >= 80 ? 'Great job!' : activeQuiz.score >= 50 ? 'Good effort!' : 'Keep learning!'}
                              </h3>
                              <p className="text-gray-600">
                                {activeQuiz.score >= 80 
                                  ? 'You\'re an eco-expert!' 
                                  : activeQuiz.score >= 50 
                                  ? 'You have a solid understanding of environmental concepts.' 
                                  : 'There\'s always more to learn about sustainability.'}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-6">
                              <Award className="h-5 w-5 text-yellow-500" />
                              <span className="font-medium">
                                {activeQuiz.awardedPoints ?? 0} Eco-Points Earned (based on {activeQuiz.score}% score)
                              </span>
                            </div>
                            
                            <Button disabled className="bg-gray-300 cursor-not-allowed">Attempted</Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>

        {/* Daily Eco Tips */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Daily Eco Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ecoTips.map((tip) => (
              <Card key={tip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span>{tip.title}</span>
                    </CardTitle>
                    {tip.read ? (
                      <Badge variant="outline">Read</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">New</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{tip.description}</p>
                  <div className="flex justify-between items-center">
                    <Badge className="bg-green-100 text-green-800">
                      +{tip.points} pts
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-green-600">
                      {tip.read ? 'Reread Tip' : 'Mark as Read'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LearnQuiz;
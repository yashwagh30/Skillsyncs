import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Lightbulb, Mic, Square, Play, X } from "lucide-react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function InterviewQuestions() {
  const [, setLocation] = useLocation();
  const [currentCategory, setCurrentCategory] = useState("behavioral");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { text: string; audio: string | null }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);
  const { toast } = useToast();

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const questionsByCategory: Record<string, string[]> = {
    behavioral: [
      "Tell me about a challenging project you worked on and how you overcame the obstacles.",
      "Describe a time when you had to manage conflicting priorities.",
      "Give an example of a mistake you made and what you learned from it.",
      "How do you handle constructive criticism?",
    ],
    technical: [
      "Explain the difference between REST and GraphQL.",
      "How does React's virtual DOM work?",
      "What are microservices and what are their benefits/drawbacks?",
      "Explain the concept of closure in JavaScript.",
    ],
    leadership: [
      "Describe your leadership style.",
      "How do you motivate a team under tight deadlines?",
      "Tell me about a time you mentored a junior developer.",
    ],
    "problem-solving": [
      "How do you approach debugging a complex issue?",
      "Describe a time you had to be creative to solve a problem.",
    ],
  };

  const categories = [
    { id: "behavioral", name: "Behavioral" },
    { id: "technical", name: "Technical" },
    { id: "leadership", name: "Leadership" },
    { id: "problem-solving", name: "Problem Solving" },
  ];

  const currentQuestions = questionsByCategory[currentCategory];
  const currentQuestion = currentQuestions[questionIndex];

  // Reset index when category changes
  useEffect(() => {
    setQuestionIndex(0);
    setAudioUrl(null);
    // Removed setResult(null) and setAnswers({}) to persist state across categories and only reset on full restart
  }, [currentCategory]);

  const currentAnswer = answers[`${currentCategory}-${questionIndex}`]?.text || "";
  const currentAudio = answers[`${currentCategory}-${questionIndex}`]?.audio || audioUrl;

  const handleTextChange = (text: string) => {
    setAnswers(prev => ({
      ...prev,
      [`${currentCategory}-${questionIndex}`]: { ...prev[`${currentCategory}-${questionIndex}`], text, audio: currentAudio }
    }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert to Base64 for storage
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAnswers(prev => ({
            ...prev,
            [`${currentCategory}-${questionIndex}`]: {
              ...prev[`${currentCategory}-${questionIndex}`],
              text: currentAnswer,
              audio: base64Audio
            }
          }));
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure you have granted permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const currentCategoryIndex = categories.findIndex(c => c.id === currentCategory);

  const handleNext = () => {
    if (questionIndex < currentQuestions.length - 1) {
      setQuestionIndex(prev => prev + 1);
      setAudioUrl(null);
    } else if (currentCategoryIndex < categories.length - 1) {
      // Move to next category
      setCurrentCategory(categories[currentCategoryIndex + 1].id);
      // The useEffect on currentCategory will reset questionIndex to 0
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Format answers for API - Submit ALL answers
      const formattedAnswers = Object.entries(answers)
        .map(([key, value]) => ({
          questionId: key.split('-')[1], // extraction of index
          category: key.split('-')[0],   // extraction of category
          text: value.text,
          audio: value.audio || undefined
        }));

      if (formattedAnswers.length === 0) {
        toast({
          title: "No answers provided",
          description: "Please answer at least one question before submitting.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const res = await apiRequest("POST", "/api/interviews", {
        category: "overall", // Submitting full interview
        answers: formattedAnswers
      });

      const data = await res.json();
      setResult({ score: data.score, feedback: data.feedback });

      toast({
        title: "Interview Submitted!",
        description: `You scored ${data.score}/10`,
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate Progress
  const totalQuestions = Object.values(questionsByCategory).flat().length;
  const answeredCount = Object.keys(answers).length;
  const progressValue = Math.min((answeredCount / totalQuestions) * 100, 100);

  const feedback = [
    {
      type: "positive",
      icon: CheckCircle,
      message: "Good use of specific examples and quantifiable results",
    },
    {
      type: "suggestion",
      icon: Lightbulb,
      message: "Consider adding more details about your problem-solving process",
    },
  ];

  return (
    <div className="gradient-bg min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Interview Questions</h1>
              <p className="text-muted-foreground">Practice with AI-powered interview questions tailored to your industry</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">
                    Question {questionIndex + 1} of {currentQuestions.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!result ? (
                    <>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-foreground text-lg font-medium">{currentQuestion}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Your Answer</label>
                        <Textarea
                          value={currentAnswer}
                          onChange={(e) => handleTextChange(e.target.value)}
                          className="h-32 bg-input border-border text-foreground placeholder-muted-foreground resize-none"
                          placeholder="Type your answer here..."
                          data-testid="textarea-answer"
                        />
                      </div>

                      {currentAudio && (
                        <div className="bg-muted/20 p-2 rounded flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          <audio src={currentAudio} controls className="w-full h-8" />
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        {!isRecording ? (
                          <Button
                            className="btn-primary"
                            onClick={startRecording}
                            data-testid="button-record"
                          >
                            <Mic className="h-4 w-4 mr-2" />
                            Record Answer
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            onClick={stopRecording}
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Stop Recording
                          </Button>
                        )}


                        {currentCategoryIndex === categories.length - 1 && questionIndex === currentQuestions.length - 1 ? (
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            data-testid="button-submit-final"
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Submit Interview
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={handleNext}
                            data-testid="button-next"
                          >
                            Next Question
                          </Button>
                        )}

                        {/* Submit Button logic now handled in the main flow above */}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                        <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">Score: {result.score}/10</h3>
                        <p className="text-muted-foreground">{result.feedback}</p>
                      </div>
                      <Button onClick={() => {
                        setResult(null);
                        setAnswers({});
                        setQuestionIndex(0);
                      }} className="w-full">
                        Start New Interview
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">AI Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feedback.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <item.icon
                          className={`mt-1 h-4 w-4 ${item.type === 'positive' ? 'text-green-500' : 'text-yellow-500'
                            }`}
                        />
                        <p className="text-muted-foreground text-sm">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Questions Completed</span>
                    <span className="text-foreground font-medium">{answeredCount}/{totalQuestions}</span>
                  </div>
                  <Progress value={progressValue} className="w-full" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Average Score</span>
                    <span className="text-foreground font-medium">--/10</span>
                  </div>

                  {!result && (
                    <Button
                      className="w-full mt-4"
                      variant={answeredCount === totalQuestions ? "default" : "secondary"}
                      onClick={handleSubmit}
                      disabled={answeredCount < totalQuestions || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {answeredCount < totalQuestions
                        ? `Answer All Questions to Submit`
                        : "Submit Full Interview"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Question Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={currentCategory === category.id ? "default" : "ghost"}
                        className={`w-full justify-start ${currentCategory === category.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50"
                          }`}
                        onClick={() => setCurrentCategory(category.id)}
                        data-testid={`category-${category.id}`}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

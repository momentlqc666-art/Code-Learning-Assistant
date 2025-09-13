import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Shuffle, Trophy, Clock, Star, CheckCircle } from 'lucide-react';

interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  timeEstimate: string;
  points: number;
  starterCode: string;
  solution: string;
  testCases: { input: string; expected: string }[];
}

const exercises: Exercise[] = [
  {
    id: '1',
    title: 'Array Sum Calculator',
    description: 'Write a function that calculates the sum of all numbers in an array',
    difficulty: 'Easy',
    topic: 'Arrays',
    timeEstimate: '5 min',
    points: 10,
    starterCode: `function sumArray(numbers) {
  // Your code here
  
}

// Test your function
console.log(sumArray([1, 2, 3, 4, 5])); // Should return 15`,
    solution: `function sumArray(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}`,
    testCases: [
      { input: '[1, 2, 3, 4, 5]', expected: '15' },
      { input: '[10, -5, 3]', expected: '8' },
      { input: '[]', expected: '0' }
    ]
  },
  {
    id: '2',
    title: 'String Reverser',
    description: 'Create a function that reverses a string without using built-in reverse method',
    difficulty: 'Medium',
    topic: 'Strings',
    timeEstimate: '10 min',
    points: 20,
    starterCode: `function reverseString(str) {
  // Your code here - don't use .reverse()
  
}

// Test your function
console.log(reverseString("hello")); // Should return "olleh"`,
    solution: `function reverseString(str) {
  let reversed = '';
  for (let i = str.length - 1; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}`,
    testCases: [
      { input: '"hello"', expected: '"olleh"' },
      { input: '"JavaScript"', expected: '"tpircSavaJ"' },
      { input: '""', expected: '""' }
    ]
  },
  {
    id: '3',
    title: 'Fibonacci Generator',
    description: 'Implement a function that generates the first n numbers in the Fibonacci sequence',
    difficulty: 'Hard',
    topic: 'Algorithms',
    timeEstimate: '15 min',
    points: 30,
    starterCode: `function fibonacci(n) {
  // Your code here
  
}

// Test your function
console.log(fibonacci(7)); // Should return [0, 1, 1, 2, 3, 5, 8]`,
    solution: `function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  
  const sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence[i] = sequence[i - 1] + sequence[i - 2];
  }
  return sequence;
}`,
    testCases: [
      { input: '7', expected: '[0, 1, 1, 2, 3, 5, 8]' },
      { input: '1', expected: '[0]' },
      { input: '0', expected: '[]' }
    ]
  }
];

interface ExerciseGeneratorProps {
  selectedTopic: string;
  onLoadExercise: (code: string) => void;
}

export const ExerciseGenerator = ({ selectedTopic, onLoadExercise }: ExerciseGeneratorProps) => {
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [showSolution, setShowSolution] = useState(false);

  const generateRandomExercise = () => {
    const randomIndex = Math.floor(Math.random() * exercises.length);
    const exercise = exercises[randomIndex];
    setCurrentExercise(exercise);
    setShowSolution(false);
    onLoadExercise(exercise.starterCode);
  };

  const markCompleted = () => {
    if (currentExercise && !completedExercises.includes(currentExercise.id)) {
      setCompletedExercises([...completedExercises, currentExercise.id]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-accent/20 text-accent border-accent/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Hard': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  return (
    <Card className="h-full bg-card border-border shadow-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Coding Exercises</h3>
          </div>
          <Button onClick={generateRandomExercise} variant="outline" size="sm">
            <Shuffle className="w-4 h-4 mr-1" />
            Random Exercise
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>{completedExercises.length} completed</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{completedExercises.length * 20} points</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-100px)] p-4">
        {currentExercise ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-foreground">
                  {currentExercise.title}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(currentExercise.difficulty)}>
                    {currentExercise.difficulty}
                  </Badge>
                  {completedExercises.includes(currentExercise.id) && (
                    <CheckCircle className="w-5 h-5 text-accent" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{currentExercise.timeEstimate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>{currentExercise.points} points</span>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                  {currentExercise.topic}
                </Badge>
              </div>

              <p className="text-muted-foreground">{currentExercise.description}</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h5 className="font-medium text-foreground">Test Cases:</h5>
              <div className="space-y-2">
                {currentExercise.testCases.map((testCase, index) => (
                  <div key={index} className="bg-muted/30 p-3 rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Input:</span>
                      <code className="text-foreground">{testCase.input}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected:</span>
                      <code className="text-accent">{testCase.expected}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={markCompleted}
                disabled={completedExercises.includes(currentExercise.id)}
                className="flex-1"
              >
                {completedExercises.includes(currentExercise.id) ? 'Completed!' : 'Mark Complete'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSolution(!showSolution)}
                className="flex-1"
              >
                {showSolution ? 'Hide Solution' : 'Show Solution'}
              </Button>
            </div>

            {showSolution && (
              <Card className="p-4 bg-muted/30 border-border">
                <h6 className="font-medium text-foreground mb-2">Solution:</h6>
                <pre className="text-sm text-muted-foreground overflow-x-auto">
                  <code>{currentExercise.solution}</code>
                </pre>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-center">
            <div className="space-y-3">
              <Trophy className="w-12 h-12 text-primary mx-auto" />
              <div>
                <p className="text-foreground font-medium">Ready to Practice?</p>
                <p className="text-sm text-muted-foreground">
                  Click "Random Exercise" to get started with a coding challenge!
                </p>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
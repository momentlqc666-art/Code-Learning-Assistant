import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ChevronRight, ChevronLeft, Play, CheckCircle, Clock } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  code?: string;
  explanation: string;
  tips?: string[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  steps: TutorialStep[];
}

const tutorials: Tutorial[] = [
  {
    id: 'js-basics',
    title: 'JavaScript Fundamentals',
    description: 'Learn the core concepts of JavaScript programming',
    difficulty: 'Beginner',
    duration: '30 min',
    steps: [
      {
        id: '1',
        title: 'Variables and Data Types',
        content: 'In JavaScript, you can store data in variables using let, const, or var keywords.',
        code: `// Different ways to declare variables
let name = "John";        // String
const age = 25;          // Number
let isStudent = true;    // Boolean
let hobbies = ["coding", "reading"]; // Array
let person = { name: "Alice", age: 30 }; // Object`,
        explanation: 'Variables are containers for storing data. Use "const" for values that won\'t change, "let" for values that might change, and avoid "var" in modern JavaScript.',
        tips: [
          'Always use meaningful variable names',
          'Prefer const over let when the value doesn\'t change',
          'Use camelCase for variable naming'
        ]
      },
      {
        id: '2',
        title: 'Functions',
        content: 'Functions are reusable blocks of code that perform specific tasks.',
        code: `// Function declaration
function greet(name) {
  return "Hello, " + name + "!";
}

// Arrow function (ES6+)
const greetArrow = (name) => {
  return \`Hello, \${name}!\`;
};

// Short arrow function
const greetShort = name => \`Hello, \${name}!\`;

// Using the functions
console.log(greet("Alice"));
console.log(greetArrow("Bob"));`,
        explanation: 'Functions help organize code and make it reusable. Arrow functions provide a more concise syntax and have different "this" binding behavior.',
        tips: [
          'Keep functions small and focused on one task',
          'Use descriptive function names',
          'Consider using arrow functions for short operations'
        ]
      },
      {
        id: '3',
        title: 'Control Flow',
        content: 'Control the flow of your program using conditions and loops.',
        code: `// If-else statements
let score = 85;
if (score >= 90) {
  console.log("Excellent!");
} else if (score >= 70) {
  console.log("Good job!");
} else {
  console.log("Keep practicing!");
}

// For loop
for (let i = 0; i < 5; i++) {
  console.log("Count: " + i);
}

// Array iteration
const fruits = ["apple", "banana", "orange"];
fruits.forEach(fruit => {
  console.log("I like " + fruit);
});`,
        explanation: 'Control flow statements help you make decisions and repeat actions in your code.',
        tips: [
          'Use forEach, map, filter for array operations',
          'Consider switch statements for multiple conditions',
          'Break complex conditions into smaller, readable parts'
        ]
      }
    ]
  },
  {
    id: 'react-intro',
    title: 'React Components',
    description: 'Build interactive user interfaces with React',
    difficulty: 'Intermediate',
    duration: '45 min',
    steps: [
      {
        id: '1',
        title: 'Creating Components',
        content: 'React components are the building blocks of React applications.',
        code: `import React from 'react';

// Functional component
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// Arrow function component
const WelcomeArrow = ({ name }) => {
  return <h1>Hello, {name}!</h1>;
};

// Using the component
function App() {
  return (
    <div>
      <Welcome name="Alice" />
      <WelcomeArrow name="Bob" />
    </div>
  );
}`,
        explanation: 'Components let you split the UI into independent, reusable pieces. Props allow you to pass data from parent to child components.',
        tips: [
          'Use PascalCase for component names',
          'Keep components small and focused',
          'Use destructuring for props when possible'
        ]
      },
      {
        id: '2',
        title: 'State Management',
        content: 'State allows components to have dynamic data that can change over time.',
        code: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
      
      <input 
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <p>Hello, {name}!</p>
    </div>
  );
}`,
        explanation: 'useState hook allows functional components to have state. Always use the setter function to update state.',
        tips: [
          'State updates are asynchronous',
          'Don\'t mutate state directly',
          'Use functional updates for complex state logic'
        ]
      }
    ]
  }
];

interface TutorialSystemProps {
  onLoadTutorialCode: (code: string) => void;
}

export const TutorialSystem = ({ onLoadTutorialCode }: TutorialSystemProps) => {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const handleTutorialSelect = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setCurrentStep(0);
    if (tutorial.steps[0]?.code) {
      onLoadTutorialCode(tutorial.steps[0].code);
    }
  };

  const handleStepNavigation = (direction: 'next' | 'prev') => {
    if (!selectedTutorial) return;
    
    const newStep = direction === 'next' 
      ? Math.min(currentStep + 1, selectedTutorial.steps.length - 1)
      : Math.max(currentStep - 1, 0);
    
    setCurrentStep(newStep);
    if (selectedTutorial.steps[newStep]?.code) {
      onLoadTutorialCode(selectedTutorial.steps[newStep].code);
    }
  };

  const markStepCompleted = () => {
    if (selectedTutorial) {
      const stepId = selectedTutorial.steps[currentStep].id;
      setCompletedSteps(new Set([...completedSteps, stepId]));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-accent/20 text-accent border-accent/30';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Advanced': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  if (!selectedTutorial) {
    return (
      <Card className="h-full bg-card border-border shadow-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Interactive Tutorials</h3>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-80px)] p-4">
          <div className="space-y-4">
            {tutorials.map((tutorial) => (
              <Card 
                key={tutorial.id}
                className="p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-glow bg-muted/50 hover:bg-muted border-border hover:border-primary"
                onClick={() => handleTutorialSelect(tutorial)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{tutorial.title}</h4>
                    <Badge className={getDifficultyColor(tutorial.difficulty)}>
                      {tutorial.difficulty}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{tutorial.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{tutorial.steps.length} steps</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Card>
    );
  }

  const currentStepData = selectedTutorial.steps[currentStep];
  const progress = ((currentStep + 1) / selectedTutorial.steps.length) * 100;

  return (
    <Card className="h-full bg-card border-border shadow-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedTutorial(null)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold">{selectedTutorial.title}</h3>
          </div>
          <Badge className={getDifficultyColor(selectedTutorial.difficulty)}>
            {selectedTutorial.difficulty}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep + 1} of {selectedTutorial.steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-140px)] p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-foreground">
              {currentStepData.title}
            </h4>
            <p className="text-muted-foreground">{currentStepData.content}</p>
          </div>

          <Card className="p-4 bg-muted/30 border-border">
            <h5 className="font-medium text-foreground mb-2">Explanation:</h5>
            <p className="text-sm text-muted-foreground">{currentStepData.explanation}</p>
          </Card>

          {currentStepData.tips && (
            <Card className="p-4 bg-accent/10 border-accent/30">
              <h5 className="font-medium text-foreground mb-2">💡 Tips:</h5>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {currentStepData.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => handleStepNavigation('prev')}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <Button 
            onClick={markStepCompleted}
            disabled={completedSteps.has(currentStepData.id)}
            variant={completedSteps.has(currentStepData.id) ? "outline" : "default"}
          >
            {completedSteps.has(currentStepData.id) ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Completed
              </>
            ) : (
              'Mark Complete'
            )}
          </Button>
          
          <Button 
            onClick={() => handleStepNavigation('next')}
            disabled={currentStep === selectedTutorial.steps.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
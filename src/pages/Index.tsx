import { useState } from 'react';
import { Header } from '@/components/Header';
import { TopicSelector } from '@/components/TopicSelector';
import { CodeEditor } from '@/components/CodeEditor';
import { AIChat } from '@/components/AIChat';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, BookOpen, Target } from 'lucide-react';

const codeExamples = {
  javascript: `// JavaScript Fundamentals
function greetUser(name) {
  return \`Hello, \${name}! Welcome to CodeLearner AI.\`;
}

// Example usage
const userName = "Developer";
console.log(greetUser(userName));

// Try modifying this code!`,
  react: `// React Component Example
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;`,
  python: `# Python Basics
def calculate_fibonacci(n):
    """Calculate Fibonacci sequence up to n terms"""
    sequence = []
    a, b = 0, 1
    
    for i in range(n):
        sequence.append(a)
        a, b = b, a + b
    
    return sequence

# Try it out
result = calculate_fibonacci(10)
print(f"Fibonacci sequence: {result}")`,
};

const lessons = [
  { id: 1, title: "Variables and Data Types", completed: true },
  { id: 2, title: "Functions and Scope", completed: true },
  { id: 3, title: "Control Flow", completed: false },
  { id: 4, title: "Objects and Arrays", completed: false },
  { id: 5, title: "Async Programming", completed: false },
];

const Index = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>('javascript');
  const completedLessons = lessons.filter(lesson => lesson.completed).length;
  const progressPercentage = (completedLessons / lessons.length) * 100;

  const handleRunCode = (code: string) => {
    console.log('Running code:', code);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {!selectedTopic ? (
          <TopicSelector 
            selectedTopic={selectedTopic} 
            onTopicSelect={setSelectedTopic} 
          />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              {/* Code Editor */}
              <div className="lg:col-span-2">
                <CodeEditor
                  language={selectedTopic}
                  initialCode={codeExamples[selectedTopic as keyof typeof codeExamples]}
                  onRunCode={handleRunCode}
                />
              </div>

              {/* AI Chat */}
              <div>
                <AIChat />
              </div>
            </div>

            {/* Learning Progress Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card className="p-6 bg-card border-border shadow-card">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Progress</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>JavaScript Course</span>
                        <span>{completedLessons}/{lessons.length}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          {lesson.completed ? (
                            <CheckCircle className="w-4 h-4 text-accent" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={`text-sm ${lesson.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {lesson.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <TopicSelector 
                  selectedTopic={selectedTopic} 
                  onTopicSelect={setSelectedTopic} 
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
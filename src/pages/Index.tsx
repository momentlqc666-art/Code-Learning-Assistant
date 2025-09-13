import { useState } from 'react';
import { Header } from '@/components/Header';
import { TopicSelector } from '@/components/TopicSelector';
import { CodeEditor } from '@/components/CodeEditor';
import { AIChat } from '@/components/AIChat';
import { CodeAnalyzer } from '@/components/CodeAnalyzer';
import { ExerciseGenerator } from '@/components/ExerciseGenerator';
import { TutorialSystem } from '@/components/TutorialSystem';
import { DebugHelper } from '@/components/DebugHelper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Circle, BookOpen, Target, Code, Bug, Trophy, Brain } from 'lucide-react';

const codeExamples = {
  javascript: `// JavaScript Fundamentals - Interactive Learning
function greetUser(name) {
  if (!name) {
    throw new Error("Name is required!");
  }
  return \`Hello, \${name}! Welcome to CodeLearner AI.\`;
}

// Example usage with error handling
try {
  const userName = "Developer";
  console.log(greetUser(userName));
  
  // This will cause an error - try it!
  // console.log(greetUser());
} catch (error) {
  console.error("Error:", error.message);
}

// Advanced: Async function example
async function fetchUserData(userId) {
  const response = await fetch(\`/api/users/\${userId}\`);
  return response.json();
}`,
  react: `// React Component with Hooks - Best Practices
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(\`/api/users/\${userId}\`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}

export default UserProfile;`,
  python: `# Python Best Practices - Data Analysis Example
import pandas as pd
import numpy as np
from typing import List, Dict, Optional

def analyze_student_performance(scores: List[Dict[str, float]]) -> Dict[str, float]:
    """
    Analyze student performance data and return statistics.
    
    Args:
        scores: List of dictionaries containing student scores
        
    Returns:
        Dictionary with performance statistics
    """
    if not scores:
        raise ValueError("Scores list cannot be empty")
    
    # Convert to DataFrame for easier analysis
    df = pd.DataFrame(scores)
    
    # Calculate statistics
    stats = {
        'average_score': df['score'].mean(),
        'median_score': df['score'].median(),
        'std_deviation': df['score'].std(),
        'max_score': df['score'].max(),
        'min_score': df['score'].min(),
        'pass_rate': (df['score'] >= 60).mean() * 100
    }
    
    return stats

# Example usage
student_scores = [
    {'name': 'Alice', 'score': 92.5},
    {'name': 'Bob', 'score': 78.0},
    {'name': 'Charlie', 'score': 85.5},
    {'name': 'Diana', 'score': 96.0}
]

try:
    performance_stats = analyze_student_performance(student_scores)
    print(f"Class Performance Analysis:")
    for metric, value in performance_stats.items():
        print(f"{metric}: {value:.2f}")
except ValueError as e:
    print(f"Error: {e}")`,
};

const lessons = [
  { id: 1, title: "Variables and Data Types", completed: true },
  { id: 2, title: "Functions and Scope", completed: true },
  { id: 3, title: "Control Flow", completed: false },
  { id: 4, title: "Objects and Arrays", completed: false },
  { id: 5, title: "Async Programming", completed: false },
  { id: 6, title: "Error Handling", completed: false },
  { id: 7, title: "Testing & Debugging", completed: false },
];

const Index = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>('javascript');
  const [currentCode, setCurrentCode] = useState(codeExamples.javascript);
  const [activeTab, setActiveTab] = useState('editor');
  
  const completedLessons = lessons.filter(lesson => lesson.completed).length;
  const progressPercentage = (completedLessons / lessons.length) * 100;

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    setCurrentCode(codeExamples[topicId as keyof typeof codeExamples] || '');
  };

  const handleRunCode = (code: string) => {
    console.log('Running code:', code);
    setCurrentCode(code);
  };

  const handleLoadExercise = (code: string) => {
    setCurrentCode(code);
    setActiveTab('editor');
  };

  const handleLoadTutorialCode = (code: string) => {
    setCurrentCode(code);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {!selectedTopic ? (
          <TopicSelector 
            selectedTopic={selectedTopic} 
            onTopicSelect={handleTopicSelect} 
          />
        ) : (
          <>
            {/* Main Learning Interface */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
              
              {/* Code Editor - Takes up 2 columns */}
              <div className="xl:col-span-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="editor" className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Analysis
                    </TabsTrigger>
                    <TabsTrigger value="debug" className="flex items-center gap-2">
                      <Bug className="w-4 h-4" />
                      Debug
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Help
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="editor" className="h-[calc(100%-60px)]">
                    <CodeEditor
                      language={selectedTopic}
                      initialCode={currentCode}
                      onRunCode={handleRunCode}
                    />
                  </TabsContent>
                  
                  <TabsContent value="analysis" className="h-[calc(100%-60px)]">
                    <CodeAnalyzer code={currentCode} language={selectedTopic} />
                  </TabsContent>
                  
                  <TabsContent value="debug" className="h-[calc(100%-60px)]">
                    <DebugHelper code={currentCode} />
                  </TabsContent>
                  
                  <TabsContent value="ai" className="h-[calc(100%-60px)]">
                    <AIChat />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Learning Resources - Takes up 2 columns */}
              <div className="xl:col-span-2">
                <Tabs defaultValue="tutorials" className="h-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="tutorials" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Tutorials
                    </TabsTrigger>
                    <TabsTrigger value="exercises" className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Exercises
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tutorials" className="h-[calc(100%-60px)]">
                    <TutorialSystem onLoadTutorialCode={handleLoadTutorialCode} />
                  </TabsContent>
                  
                  <TabsContent value="exercises" className="h-[calc(100%-60px)]">
                    <ExerciseGenerator 
                      selectedTopic={selectedTopic} 
                      onLoadExercise={handleLoadExercise} 
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Progress Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card className="p-6 bg-card border-border shadow-card">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Learning Progress</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="capitalize">{selectedTopic} Course</span>
                        <span>{completedLessons}/{lessons.length}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          {lesson.completed ? (
                            <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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

              {/* Topic Selector */}
              <div className="lg:col-span-3">
                <TopicSelector 
                  selectedTopic={selectedTopic} 
                  onTopicSelect={handleTopicSelect} 
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
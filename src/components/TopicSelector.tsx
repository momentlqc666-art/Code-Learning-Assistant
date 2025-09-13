import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Database, Globe, Smartphone, Brain, Server } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  color: string;
}

const topics: Topic[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: <Code className="w-5 h-5" />,
    description: 'Learn modern JavaScript fundamentals',
    difficulty: 'Beginner',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  {
    id: 'react',
    name: 'React',
    icon: <Globe className="w-5 h-5" />,
    description: 'Build interactive user interfaces',
    difficulty: 'Intermediate',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'python',
    name: 'Python',
    icon: <Brain className="w-5 h-5" />,
    description: 'Data science and web development',
    difficulty: 'Beginner',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  {
    id: 'database',
    name: 'SQL & Databases',
    icon: <Database className="w-5 h-5" />,
    description: 'Master data management',
    difficulty: 'Intermediate',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'mobile',
    name: 'Mobile Dev',
    icon: <Smartphone className="w-5 h-5" />,
    description: 'iOS and Android development',
    difficulty: 'Advanced',
    color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  {
    id: 'backend',
    name: 'Backend APIs',
    icon: <Server className="w-5 h-5" />,
    description: 'Server-side development',
    difficulty: 'Advanced',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
];

interface TopicSelectorProps {
  selectedTopic: string | null;
  onTopicSelect: (topicId: string) => void;
}

export const TopicSelector = ({ selectedTopic, onTopicSelect }: TopicSelectorProps) => {
  return (
    <Card className="p-6 bg-card border-border shadow-card">
      <h2 className="text-xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
        Choose Your Learning Path
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <Card
            key={topic.id}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-glow ${
              selectedTopic === topic.id 
                ? 'ring-2 ring-primary bg-primary/10 border-primary' 
                : 'bg-muted/50 hover:bg-muted border-border'
            }`}
            onClick={() => onTopicSelect(topic.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${topic.color}`}>
                {topic.icon}
              </div>
              <Badge 
                variant={topic.difficulty === 'Beginner' ? 'default' : topic.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {topic.difficulty}
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground mb-2">{topic.name}</h3>
            <p className="text-sm text-muted-foreground">{topic.description}</p>
          </Card>
        ))}
      </div>
    </Card>
  );
};
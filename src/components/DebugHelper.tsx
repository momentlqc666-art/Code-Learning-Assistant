import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Bug, Search, Lightbulb, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DebugSuggestion {
  id: string;
  type: 'error' | 'warning' | 'tip';
  title: string;
  description: string;
  solution: string;
  codeExample?: string;
}

const commonIssues: DebugSuggestion[] = [
  {
    id: '1',
    type: 'error',
    title: 'Undefined Variable',
    description: 'Variable is being used before declaration or is out of scope',
    solution: 'Declare the variable before using it, or check if it\'s accessible in the current scope.',
    codeExample: `// ❌ Wrong
console.log(name); // Error: name is not defined

// ✅ Correct
let name = "John";
console.log(name);`
  },
  {
    id: '2',
    type: 'error',
    title: 'Cannot read property of undefined',
    description: 'Trying to access a property of an undefined or null object',
    solution: 'Use optional chaining (?.) or check if the object exists before accessing properties.',
    codeExample: `// ❌ Wrong
const user = null;
console.log(user.name); // Error

// ✅ Correct
const user = null;
console.log(user?.name); // undefined (no error)
// or
if (user) {
  console.log(user.name);
}`
  },
  {
    id: '3',
    type: 'warning',
    title: 'Infinite Loop',
    description: 'Loop condition never becomes false, causing the program to hang',
    solution: 'Ensure the loop variable is properly updated and the condition will eventually be false.',
    codeExample: `// ❌ Wrong
let i = 0;
while (i < 10) {
  console.log(i); // i never changes!
}

// ✅ Correct
let i = 0;
while (i < 10) {
  console.log(i);
  i++; // Update the counter
}`
  },
  {
    id: '4',
    type: 'tip',
    title: 'Array Index Out of Bounds',
    description: 'Accessing array elements with invalid indices',
    solution: 'Check array length before accessing elements or use safe methods.',
    codeExample: `// ❌ Risky
const arr = [1, 2, 3];
console.log(arr[10]); // undefined

// ✅ Safe
const arr = [1, 2, 3];
if (arr.length > 10) {
  console.log(arr[10]);
}
// or use optional chaining
console.log(arr.at(10)); // undefined (safe)`
  }
];

interface DebugHelperProps {
  code: string;
}

export const DebugHelper = ({ code }: DebugHelperProps) => {
  const [errorDescription, setErrorDescription] = useState('');
  const [suggestions, setSuggestions] = useState<DebugSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeError = () => {
    setIsAnalyzing(true);
    
    // Simulate error analysis
    setTimeout(() => {
      const relevantSuggestions = commonIssues.filter(issue => {
        const keywords = errorDescription.toLowerCase();
        return keywords.includes('undefined') || 
               keywords.includes('null') || 
               keywords.includes('loop') ||
               keywords.includes('property') ||
               code.includes('undefined') ||
               code.includes('while') ||
               code.includes('for');
      });
      
      setSuggestions(relevantSuggestions.length > 0 ? relevantSuggestions : commonIssues);
      setIsAnalyzing(false);
    }, 1000);
  };

  const copyCodeExample = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: "Example code has been copied to clipboard",
      duration: 2000,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'tip': return <Lightbulb className="w-4 h-4 text-accent" />;
      default: return <CheckCircle className="w-4 h-4 text-accent" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'tip': return 'bg-accent/20 text-accent border-accent/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  return (
    <Card className="h-full bg-card border-border shadow-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Bug className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Debug Helper</h3>
        </div>
        
        <div className="space-y-3">
          <Textarea
            placeholder="Describe the error or issue you're experiencing..."
            value={errorDescription}
            onChange={(e) => setErrorDescription(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={analyzeError} 
            disabled={isAnalyzing || !errorDescription.trim()}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Get Debug Suggestions'}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-180px)] p-4">
        {suggestions.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Debug Suggestions:</h4>
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="p-4 bg-muted/30 border-border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(suggestion.type)}
                      <h5 className="font-medium text-foreground">{suggestion.title}</h5>
                    </div>
                    <Badge className={getTypeColor(suggestion.type)}>
                      {suggestion.type}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                  
                  <div className="bg-accent/10 p-3 rounded border border-accent/20">
                    <h6 className="text-sm font-medium text-foreground mb-1">Solution:</h6>
                    <p className="text-sm text-muted-foreground">{suggestion.solution}</p>
                  </div>
                  
                  {suggestion.codeExample && (
                    <div className="bg-code-bg p-3 rounded border border-code-border">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="text-sm font-medium text-foreground">Code Example:</h6>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCodeExample(suggestion.codeExample!)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <pre className="text-xs text-muted-foreground overflow-x-auto">
                        <code>{suggestion.codeExample}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-center">
            <div className="space-y-2">
              <Bug className="w-8 h-8 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Describe your issue above to get personalized debugging suggestions
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
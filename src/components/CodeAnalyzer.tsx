import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Info, Zap, Target, Clock } from 'lucide-react';

interface AnalysisResult {
  type: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  line?: number;
  severity: 'high' | 'medium' | 'low';
  fix?: string;
}

interface CodeAnalyzerProps {
  code: string;
  language: string;
}

export const CodeAnalyzer = ({ code, language }: CodeAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCode = () => {
    setIsAnalyzing(true);
    
    // Simulate code analysis
    setTimeout(() => {
      const results: AnalysisResult[] = [];
      
      // Basic analysis rules
      if (code.includes('var ')) {
        results.push({
          type: 'warning',
          message: 'Use "let" or "const" instead of "var" for better scoping',
          severity: 'medium',
          fix: 'Replace "var" with "let" or "const"'
        });
      }
      
      if (code.includes('console.log') && language === 'javascript') {
        results.push({
          type: 'info',
          message: 'Console.log detected - remember to remove in production',
          severity: 'low',
          fix: 'Use proper logging library or remove debug statements'
        });
      }
      
      if (!code.includes('function') && !code.includes('=>') && code.length > 50) {
        results.push({
          type: 'suggestion',
          message: 'Consider breaking this code into functions for better modularity',
          severity: 'medium',
          fix: 'Extract reusable logic into separate functions'
        });
      }
      
      if (code.split('\n').some(line => line.length > 120)) {
        results.push({
          type: 'warning',
          message: 'Some lines are too long (>120 characters)',
          severity: 'low',
          fix: 'Break long lines for better readability'
        });
      }
      
      // Performance suggestions
      if (code.includes('for') && code.includes('forEach')) {
        results.push({
          type: 'suggestion',
          message: 'Consider using map/filter/reduce for functional programming',
          severity: 'low',
          fix: 'Use functional array methods when appropriate'
        });
      }
      
      setAnalysis(results);
      setIsAnalyzing(false);
    }, 1500);
  };

  useEffect(() => {
    if (code.trim()) {
      analyzeCode();
    }
  }, [code, language]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'suggestion': return <Zap className="w-4 h-4 text-accent" />;
      default: return <CheckCircle className="w-4 h-4 text-accent" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  return (
    <Card className="h-full bg-card border-border shadow-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Code Analysis</h3>
        </div>
        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
          {analysis.length} issues
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100%-80px)] p-4">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Analyzing code...</span>
            </div>
          </div>
        ) : analysis.length > 0 ? (
          <div className="space-y-3">
            {analysis.map((item, index) => (
              <Card key={index} className="p-4 bg-muted/30 border-border">
                <div className="flex items-start gap-3">
                  {getIcon(item.type)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {item.message}
                      </span>
                      <Badge className={getSeverityColor(item.severity)}>
                        {item.severity}
                      </Badge>
                    </div>
                    {item.fix && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <strong>Fix:</strong> {item.fix}
                      </div>
                    )}
                    {item.line && (
                      <div className="text-xs text-muted-foreground">
                        Line {item.line}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-center">
            <div className="space-y-2">
              <CheckCircle className="w-8 h-8 text-accent mx-auto" />
              <p className="text-sm text-muted-foreground">
                No issues found! Your code looks great.
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
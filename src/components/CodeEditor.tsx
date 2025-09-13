import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  language: string;
  initialCode?: string;
  onRunCode?: (code: string) => void;
}

export const CodeEditor = ({ language, initialCode = '', onRunCode }: CodeEditorProps) => {
  const [code, setCode] = useState(initialCode);
  const { toast } = useToast();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: "Code has been copied to clipboard",
      duration: 2000,
    });
  };

  const handleRunCode = () => {
    onRunCode?.(code);
    toast({
      title: "Code executed!",
      description: "Check the output below",
      duration: 2000,
    });
  };

  return (
    <Card className="h-full bg-code-bg border-code-border shadow-card">
      <div className="flex items-center justify-between p-4 border-b border-code-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-accent"></div>
          <span className="ml-2 text-sm text-muted-foreground">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopyCode}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="default" size="sm" onClick={handleRunCode} className="bg-gradient-primary">
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
        </div>
      </div>
      <div className="p-4 h-[calc(100%-80px)]">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full bg-transparent text-foreground font-mono text-sm resize-none outline-none"
          placeholder={`Write your ${language} code here...`}
          spellCheck="false"
        />
      </div>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { markdown } from "@codemirror/lang-markdown";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X } from "lucide-react";
import { getLanguageFromFilename } from "../../lib/mimeTypes";

interface FileEditorProps {
  file?: { 
    key: string; 
    name?: string;
  };
  content: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

export default function FileEditor({
  file,
  content,
  onSave,
  onCancel,
  isLoading = false,
  isSaving = false,
}: FileEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const [language, setLanguage] = useState(() => {
    return file?.name ? getLanguageFromFilename(file.name) : "javascript";
  });
  
  useEffect(() => {
    setEditorContent(content);
  }, [content]);
  
  useEffect(() => {
    if (file?.name) {
      setLanguage(getLanguageFromFilename(file.name));
    }
  }, [file]);
  
  const getLanguageExtension = () => {
    switch (language) {
      case "javascript":
      case "typescript":
        return javascript();
      case "json":
        return json();
      case "css":
        return css();
      case "html":
        return html();
      case "markdown":
        return markdown();
      default:
        return javascript();
    }
  };
  
  const handleSave = async () => {
    await onSave(editorContent);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading file content...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-[400px] border rounded-md overflow-hidden">
        <CodeMirror
          value={editorContent}
          onChange={setEditorContent}
          height="100%"
          extensions={[getLanguageExtension()]}
          theme="dark"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="text-sm"
        />
      </div>
      
      <div className="flex justify-end mt-4 space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
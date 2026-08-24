import { DragEvent, useState } from "react";

interface FileDropProps {
  onFilesChanged: (files: File[]) => void;
}

export default function FileDrop({ onFilesChanged }: FileDropProps) {

  const [dragIsOver, setDragIsOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dropText, setDropText] = useState<string>('');  
  
  // Define the event handlers
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragIsOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragIsOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {

    event.preventDefault();
    setDragIsOver(false);
    
    // handle the dropped files
    const droppedFiles = Array.from(event.dataTransfer.files);

    setDropText(droppedFiles[0].name);
    
    setFiles(droppedFiles);
    onFilesChanged(droppedFiles);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "50px",
        width: "300px",
        border: "1px dotted",
        backgroundColor: dragIsOver ? "lightgray" : "white",
      }}
    >
      {dropText || 'Drop audio file here'}
    </div>
  );
}

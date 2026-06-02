export function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <span 
        className="w-2.5 h-2.5 rounded-full bg-primary" 
        style={{ animation: 'typing-pulse 1.4s infinite' }} 
      />
      <span 
        className="w-2.5 h-2.5 rounded-full bg-primary" 
        style={{ animation: 'typing-pulse 1.4s infinite 0.2s' }} 
      />
      <span 
        className="w-2.5 h-2.5 rounded-full bg-primary" 
        style={{ animation: 'typing-pulse 1.4s infinite 0.4s' }} 
      />
    </div>
  );
}
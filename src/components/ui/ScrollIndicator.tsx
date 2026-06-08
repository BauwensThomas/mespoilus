'use client';

export default function ScrollIndicator() {
  return (
    <div 
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 lg:left-[26%] z-20"
    >
      <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">
        Scroll pour explorer
      </p>
      <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
        <div className="w-1.5 h-3 bg-gray-400 rounded-full mt-2 animate-bounce" />
      </div>
    </div>
  );
}
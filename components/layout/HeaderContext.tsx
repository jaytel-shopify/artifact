"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";

interface HeaderContent {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

interface HeaderContextType {
  headerContent: HeaderContent;
  setHeaderContent: (content: HeaderContent) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<HeaderContent>({});

  return (
    <HeaderContext.Provider value={{ headerContent, setHeaderContent }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within HeaderProvider");
  }
  return context;
}

// Hook for pages to set their header content
export function useSetHeader(content: HeaderContent) {
  const { setHeaderContent } = useHeader();
  const contentRef = useRef(content);
  
  // Always keep the ref updated with the latest content
  contentRef.current = content;
  
  // Create a stable key based on what's present
  const hasLeft = !!content.left;
  const hasCenter = !!content.center;
  const hasRight = !!content.right;

  useEffect(() => {
    // Use the ref to get the latest content
    setHeaderContent(contentRef.current);
    
    return () => {
      setHeaderContent({});
    };
    // Dependencies are the stable booleans, not the content object itself
  }, [hasLeft, hasCenter, hasRight, setHeaderContent]);
}

import * as React from "react";

interface PageWrapperProps {
  children: React.ReactNode;
}

// Provides a consistent themed section wrapper similar to AboutUsPage
const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-br from-emerald-50 via-green-50 to-green-100 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950 p-2 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;

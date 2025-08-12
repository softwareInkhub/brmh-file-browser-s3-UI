import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, Settings, User } from "lucide-react";

interface AppHeaderProps {
  onSearchChange: (search: string) => void;
  onUploadClick: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  onSearchChange, 
  onUploadClick
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      <div className="h-16 px-6">
        <div className="flex items-center justify-between h-full">
          {/* Left section with Drive logo, navigation, and search */}
          <div className="flex items-center gap-8">
            {/* Google Drive Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">BRMH Drive</h1>
            </div>

            {/* Search bar - Modern style */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                className="w-96 pl-12 pr-4 h-10 bg-gray-50 border-0 rounded-xl text-sm placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-all duration-200"
                placeholder="Search in BRMH Drive"
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Right section with account info and actions */}
          <div className="flex items-center gap-4">
            {/* Action icons */}
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
              </button>
              <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
              
              {/* Account avatar */}
              <button className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium hover:shadow-lg transition-all duration-200">
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

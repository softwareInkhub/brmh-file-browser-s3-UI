import React from "react";
import { Clock, File, Folder, Calendar } from "lucide-react";

const RecentContent: React.FC = () => {
  // Mock recent files data
  const recentFiles = [
    { id: 1, name: "Project Proposal.docx", type: "document", lastAccessed: "2 hours ago", size: "2.4 MB" },
    { id: 2, name: "Budget Spreadsheet.xlsx", type: "spreadsheet", lastAccessed: "1 day ago", size: "1.8 MB" },
    { id: 3, name: "Meeting Notes.pdf", type: "pdf", lastAccessed: "2 days ago", size: "856 KB" },
    { id: 4, name: "Design Assets", type: "folder", lastAccessed: "3 days ago", size: "15.2 MB" },
    { id: 5, name: "Presentation.pptx", type: "presentation", lastAccessed: "1 week ago", size: "4.1 MB" },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder":
        return <Folder className="h-5 w-5 text-blue-500" />;
      case "document":
        return <File className="h-5 w-5 text-blue-600" />;
      case "spreadsheet":
        return <File className="h-5 w-5 text-green-600" />;
      case "presentation":
        return <File className="h-5 w-5 text-orange-600" />;
      case "pdf":
        return <File className="h-5 w-5 text-red-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Recent</h1>
            <p className="text-gray-500">Files you've recently accessed</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="space-y-4">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {file.lastAccessed}
                      </div>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{file.size}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {recentFiles.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Clock className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No recent activity</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Files you access will appear here for quick access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentContent;

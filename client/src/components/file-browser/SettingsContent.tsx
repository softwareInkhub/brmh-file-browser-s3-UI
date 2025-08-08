import React from "react";
import { Settings, User, Shield, Bell, Palette, Download, Database } from "lucide-react";

const SettingsContent: React.FC = () => {
  const settingsSections = [
    {
      id: "account",
      title: "Account",
      icon: User,
      description: "Manage your account settings and profile",
      items: [
        { name: "Profile Information", description: "Update your name, email, and profile picture" },
        { name: "Password & Security", description: "Change your password and security settings" },
        { name: "Storage Usage", description: "View your storage usage and limits" },
      ]
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      description: "Configure your notification preferences",
      items: [
        { name: "Email Notifications", description: "Manage email notification settings" },
        { name: "Push Notifications", description: "Configure push notification preferences" },
        { name: "File Sharing Alerts", description: "Get notified when files are shared with you" },
      ]
    },
    {
      id: "privacy",
      title: "Privacy & Security",
      icon: Shield,
      description: "Control your privacy and security settings",
      items: [
        { name: "Two-Factor Authentication", description: "Add an extra layer of security" },
        { name: "Data Export", description: "Export your data and files" },
        { name: "Account Activity", description: "View recent account activity" },
      ]
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: Palette,
      description: "Customize the look and feel of your drive",
      items: [
        { name: "Theme", description: "Choose between light and dark themes" },
        { name: "Language", description: "Select your preferred language" },
        { name: "Display Settings", description: "Configure file display options" },
      ]
    },
    {
      id: "storage",
      title: "Storage & Sync",
      icon: Database,
      description: "Manage storage and synchronization settings",
      items: [
        { name: "Sync Settings", description: "Configure file synchronization" },
        { name: "Offline Access", description: "Manage offline file access" },
        { name: "Storage Management", description: "View and manage storage usage" },
      ]
    },
  ];

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="text-gray-500">Manage your account and preferences</p>
          </div>
        </div>

        <div className="grid gap-6">
          {settingsSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {section.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
                      >
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <Download className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
                  <p className="text-xs text-gray-500">Download your files and data</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                <Shield className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-gray-900">Security Check</h3>
                  <p className="text-xs text-gray-500">Review your security settings</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;

import { Switch, Route, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound, { NotFoundProps } from "@/pages/not-found";
import FileBrowser from "@/pages/FileBrowser";

import RecentFiles from "@/pages/RecentFiles";
import StarredFiles from "@/pages/StarredFiles";
import TrashFiles from "@/pages/TrashFiles";
import SharedFiles from "@/pages/SharedFiles";

// Component wrappers to adapt to wouter Router's component expectation
const FileBrowserWrapper = (props: RouteComponentProps) => <FileBrowser {...props} />;
const NotFoundWrapper = (props: RouteComponentProps) => <NotFound title="Page Not Found" message="Sorry, the page you're looking for doesn't exist." {...props} />;

function Router() {
  return (
    <Switch>
      
      <Route path="/" component={FileBrowserWrapper} />
      <Route path="/recent" component={RecentFiles} />
      <Route path="/starred" component={StarredFiles} />
      <Route path="/trash" component={TrashFiles} />
      <Route path="/shared" component={SharedFiles} />
      <Route component={NotFoundWrapper} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

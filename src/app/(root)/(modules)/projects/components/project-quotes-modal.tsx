import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Project } from "@/types";
import { ProjectQuotesTab } from "./project-quotes-tab";

interface ProjectQuotesModalProps {
  project: Project;
  onClose: () => void;
}

export function ProjectQuotesModal({ project, onClose }: ProjectQuotesModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cotizaciones - {project.name}</DialogTitle>
        </DialogHeader>
        <ProjectQuotesTab projectId={project.id} onQuoteChange={() => {}} />
      </DialogContent>
    </Dialog>
  );
}

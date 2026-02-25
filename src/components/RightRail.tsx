import type { AiAnalysis, AnalysisTone } from '@/types/api';
import AiInsightsPanel from './AiInsightsPanel';

interface Props {
  analysis: AiAnalysis | null;
  isAnalyzing: boolean;
  tone: AnalysisTone;
  onToneChange: (t: AnalysisTone) => void;
  onRegenerate: () => void;
}

const RightRail = ({
  analysis,
  isAnalyzing,
  tone,
  onToneChange,
  onRegenerate,
}: Props) => {
  return (
    <aside className="h-full min-h-0">
      <AiInsightsPanel
        analysis={analysis}
        isLoading={isAnalyzing}
        tone={tone}
        onToneChange={onToneChange}
        onRegenerate={onRegenerate}
      />
    </aside>
  );
};

export default RightRail;

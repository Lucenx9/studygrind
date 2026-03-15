import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { t, type Language } from '@/lib/i18n';

interface TopicFormProps {
  topicName: string;
  onTopicNameChange: (name: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (instructions: string) => void;
  language: Language;
}

export function TopicForm({
  topicName,
  onTopicNameChange,
  customInstructions,
  onCustomInstructionsChange,
  language,
}: TopicFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic-name">{t('upload.topicName', language)}</Label>
        <Input
          id="topic-name"
          value={topicName}
          onChange={e => onTopicNameChange(e.target.value)}
          placeholder={t('upload.topicPlaceholder', language)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="custom-instructions">
          {t('upload.customInstructions', language)} <span className="text-muted-foreground">({t('upload.optional', language)})</span>
        </Label>
        <Textarea
          id="custom-instructions"
          value={customInstructions}
          onChange={e => onCustomInstructionsChange(e.target.value)}
          placeholder={t('upload.customInstructionsPlaceholder', language)}
          className="min-h-[60px]"
        />
      </div>
    </div>
  );
}

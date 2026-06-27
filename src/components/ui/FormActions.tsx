import { colors } from "../../theme";
import Button from "./Button";

export default function FormActions({
  onCancel,
  onSave,
  saveLabel = "Salvar",
  cancelLabel = "Cancelar",
}) {
  return (
    <div className={`flex justify-end gap-3 mt-8 pt-4 border-t ${colors.border.default}`}>
      <Button variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant="primary" onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  );
}
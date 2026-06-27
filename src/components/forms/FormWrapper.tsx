import React, { ReactNode } from 'react';
import { colors } from "../../theme";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import FormActions from "../ui/FormActions";

// 1. Defina a interface das Props.
// O símbolo '?' torna a propriedade opcional, impedindo o erro de "missing property".
interface FormWrapperProps {
  breadcrumb: string;
  page: string;
  title: string;
  description: string;
  saveLabel?: string; 
  onCancel?: () => void;
  onSave?: () => void;
  children: ReactNode; // 'children' é obrigatório para envolver o conteúdo
}

// 2. Aplique a interface ao componente.
export default function FormWrapper(props: FormWrapperProps) {
  // Desestruturando as props para usar dentro do componente
  const { 
    breadcrumb, page, title, description, 
    saveLabel = "Salvar", onCancel, onSave, children 
  } = props;

  return (
    <div className={`flex-1 overflow-auto ${colors.background.app}`}>
      <TopBar breadcrumb={breadcrumb} page={page} />
      <div className="p-6 max-w-2xl">
        <PageHeader title={title} description={description} />
        
        {children}

        <FormActions
          onCancel={onCancel}
          onSave={onSave}
          saveLabel={saveLabel}
        />
      </div>
    </div>
  );
}